import isSelfConnected from './isSelfConnected'

const getConnection = (neuron, other) => {
  if (neuron === other) {
    if (isSelfConnected(neuron)) {
      return {
        type: 'selfconnection',
        connection: neuron.selfconnection
      }
    }
    return null
  }

  let result = null
  _.some(neuron.connections, (connections, type) =>
    _.some(connections, (connection) => {
      if (connection.to === other || connection.from === other) {
        result = {
          type,
          connection
        }
        return true
      }
    })
  )
  return result
}
export default getConnection
