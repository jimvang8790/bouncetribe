export const GRAPHQL_ENDPOINT = 'https://api.graph.cool/relay/v1/ciwdr6snu36fj01710o4ssheb'

export const simple = 'https://api.graph.cool/simple/v1/ciwdr6snu36fj01710o4ssheb'

export const fileUrl = 'https://api.graph.cool/file/v1/ciwdr6snu36fj01710o4ssheb'


const getUrl = () => {
  switch (process.env.NODE_ENV) {
    case 'production': {
      return 'https://test.bouncetribe.com'
    }
    default: {
      return 'http://localhost:3000'
    }
  }
}
export const url =  getUrl()
