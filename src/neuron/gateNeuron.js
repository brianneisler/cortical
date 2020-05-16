import _ from 'mudash'

const gateNeuron = (neuron, connection) => {
  // add connection to gated list
  neuron = _.update(neuron, `connections.gated.${connection.id}`, connection)

  const toNeuron = connection.to;
  if (!_.has(neuron.trace.extended, toNeuron.id) {
    // extended trace
    neuron = _.update(neuron, `neighboors.${toNeuron.id}`, toNeuron)
    const xtrace = _.mapValues(neuron.connections.inputs, () => 0)
    neuron = _.update(neuron, `trace.extended.${toNeuron.id}`, xtrace)
  }

  // keep track
  if (toNeuron.id in neuron.trace.influences)
    neuron.trace.influences[toNeuron.id].push(connection);
  else
    neuron.trace.influences[toNeuron.id] = [connection];

  // set gater
  connection = _.assoc(connection, 'gater', neuron)
  return {
    neuron,
    connection
  }
}
export default gateNeuron
