import isSelfConnected from './isSelfConnected'

// returns true or false whether the neuron is connected to another neuron (parameter)
const isConnected = (neuron, other) => {
  if (neuron === other) {
    if (isSelfConnected(neuron)) {
      return true
    }
    return false
  }

  return _.some(neuron.connections, (connections) =>
    _.some(connections, (connection) => {
      if (connection.to === other) {
        return true
      } else if (connection.from === other) {
        return true
      }
    })
  )
}
export default isConnected
