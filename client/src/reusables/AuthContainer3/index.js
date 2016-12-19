import React, {Component} from 'react'
import Relay from 'react-relay'
import {connect} from 'react-redux'
import styled from 'styled-components'
import SigninUserMutation from 'mutations/SigninUserMutation'
import CreateUserMutation from 'mutations/CreateUserMutation'
import {Err} from 'utils'
import {loginSuccess} from 'actions/auth'
import {checkIfUserEmailExists} from 'apis/graphql'
import {handleSanitizer} from 'utils/validators'

const AuthDiv = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;
  align-items: center;
  width: 250px;
`

class AuthContainer3 extends Component {

  state = {
    message: '',
  }
  componentDidMount() {
    this.init()
  }

  checkBtForEmail = async(email) => {
    let options = checkIfUserEmailExists(email)
    try {
      const btAccount = await fetch(...options).then(data => data.json()).then((json) => {
        console.log('btAccount', json)
        if (json.data.allUsers.length < 1) {
          throw json
        } else {
          return json.data.allUsers[0]
        }
      })
      console.log('A BT accounts already exists with that email', btAccount)
      return btAccount

    } catch (noUser) {
      console.log('No user with that email exists', noUser)
    }
  }

  createUserMutation = async (profile) => {
    try {
      let {
        email,
        picture,
        name,
        identities,
      } = profile

      if (identities) {
        // eslint-disable-next-line
        identities.find((identity)=>{
          if (identity.provider === 'facebook') {
            picture = identity.profileData.picture
            name = identity.profileData.name
            return 'found it'
          }
        })
      }
      let token = this.props.auth.getToken()
      await new Promise ((resolve, reject) => {
        this.props.relay.commitUpdate(
          new CreateUserMutation({
            email: email,
            idToken: token,
            profilePicUrl: picture,
            name: name,
            handle: handleSanitizer(email)
          }), {
            onSuccess: (response) => {
              console.log('Succesfully created a BT user.', response)
              this.signInMutation()
              resolve()
            },
            onFailure: (response) => {
              console.log('Failed to create a BT user.')
              reject(response.getError())
            }
          }
        )
      }).catch((reason) => {
        throw reason
      })
    } catch (error){
      console.log('CreateUserMutation error')
      throw error
    }
  }

  signInMutation = async() => {
    try {
      const token = this.props.auth.getToken()
      if (!token) throw Err('No token!')
      await new Promise ( (resolve, reject) => {
        this.props.relay.commitUpdate(
          new SigninUserMutation({
            authToken: token,
            viewer: this.props.viewer
          }), {
            onSuccess: (response) => {
              console.log('signed in to BT', response)
              let idToken = response.signinUser.token
              let user = response.signinUser.viewer.user
              this.props.loginSuccess(idToken, user)
              this.props.router.push({
                pathname: '/'
              })
              resolve()
            },
            onFailure: (response) => {
              console.log('Failed to signin to BT')
              reject(response.getError())
            }
          }
        )
      }).catch( (reason) => {
        throw reason
      })
    } catch (error) {
      throw error
    }
  }

  init = async() => {
    if (this.props.auth.getToken() && !this.props.isLoggedIn) {
      console.log('...found a token in local storage...')
      try {
        console.log('...attempting to login to BT...')
        await this.signInMutation()
      } catch (error) {
        console.log("Couldn't login to BT with the token currently in storage ", error)
        try {
          console.log('...fetching auth0Profile using token...')
          const auth0Profile = await this.props.auth.getUserInfo()
          console.log('Found a profile: ', auth0Profile)
          console.log('Attempting to create a BT user with that auth0Profile')
          try {
            await this.createUserMutation(auth0Profile)
          } catch (error) {
            console.log('Encountered an error creating that user.', error)
            try {
              console.log('...checking to see if there is already a user with that email... ')
              const primaryUser = await this.checkBtForEmail(auth0Profile.email)

              console.log('primaryUser', primaryUser)
              let auth0UserId = primaryUser.auth0UserId

              let provider = auth0UserId.split('|')[0]
              if (provider==='auth0') {
                provider = 'Username-Password-Authentication'
              }

              this.setState({
                message: `You've already got an account! Signin to connect them.`
              })
              let token = this.props.auth.getToken()
              this.props.auth.login({
                secondaryToken: token,
                primaryAuth0UserId: auth0UserId,
                provider
              })
            } catch (error) {
              console.log("That user doesn't exist in BT's database", error)
            }
          }
        } catch (error) {
          console.log("Couldn't find an auth0Profile with that token.")
        }
      }
    } else{
      this.props.auth.login()
    }
  }

  render() {
    return (
      <AuthDiv>
        <h4>{this.state.message}</h4>
        <div
          id={'auth'}
        >

        </div>
      </AuthDiv>
    )
  }
}


const mapStateToProps = (state) => {
  return {
    isLoggedIn: state.auth['id_token'],
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loginSuccess: (idToken, user) => {
      dispatch(loginSuccess(idToken, user))
    },
  }
}

AuthContainer3 = connect(
  mapStateToProps,
  mapDispatchToProps
)(AuthContainer3)

export default Relay.createContainer(
  AuthContainer3,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          id
        }
      `,
    },
  }
)