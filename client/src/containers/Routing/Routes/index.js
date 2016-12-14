import React from 'react'
import {Route, IndexRoute} from 'react-router'
import Relay from 'react-relay'
import {profileRoute, profileOptions} from 'config/auth0'
import store from 'store'
import ReduxProvider from './ReduxProvider'
import Home from './Home'
import Profile from './Profile'
import Projects from './Projects'
import Tribe from './Tribe'
import Settings from './Settings'


const ViewerQueries = {
  viewer: () => Relay.QL`query { viewer }`
}


const checkPermissions = async (nextState, replace) => {
  try {

    const errorMessage = "Sorry, you're not logged in."

    const idToken = store.getState().auth['id_token']



    if (!idToken) throw errorMessage

    const options = profileOptions(idToken)

    fetch(profileRoute, options ).then(
      (response) => response.json()
    ).then((json) => {
        if (json.statusCode) {
          throw json
        } else {
          return json
        }
    })


  } catch (error) {
    console.log(error)
    replace({
      pathname: '/login'
    })
  }
}

const createRoutes = () => {
  return (
    <Route
      path="/"
      component={ReduxProvider}
    >
      <Route
        path="/social/*"
        queries={ViewerQueries}
        component={Home}
      />

      <IndexRoute
        component={Home}
        queries={ViewerQueries}
      />
      <Route
        path="/profile/projects"
        component={Projects}
        onEnter={checkPermissions}
      />
      <Route
        path="/profile/tribe"
        component={Tribe}
        onEnter={checkPermissions}
        queries={ViewerQueries}
      />
      <Route
        path="/profile/settings"
        component={Settings}
        onEnter={checkPermissions}
        queries={ViewerQueries}
      />
      <Route
        path="/profile"
        component={Profile}
        queries={ViewerQueries}
        onEnter={checkPermissions}
      />

    </Route>
  )
}

const Routes = createRoutes()

export default Routes
