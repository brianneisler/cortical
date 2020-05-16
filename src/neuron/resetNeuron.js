import _ from 'mudash'
import clearNeuron from './clearNeuron'

// all the connections are randomized and the traces are cleared
const resetNeuron = (neuron) => {
  neuron = clearNeuron(neuron)
  neuron = _.update(neuron, 'connections', (types, type) =>
    _.update(types, type, (connections) =>
      _.mapValues(connections, (connection) =>
        _.assoc(connection, {
          weight: Math.random() * .2 - .1
        })
      )
    )
  )
  return _.assoc(neuron, {
    bias: Math.random() * .2 - .1,
    old: 0,
    state: 0,
    activation: 0
  })
}
export default resetNeuron
