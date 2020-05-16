const activate = (neuron, input) => {
  if (typeof input != 'undefined') {
    neuron.activation = input
    neuron.derivative = 0
    neuron.bias = 0
    return neuron.activation
  }

  neuron.old = neuron.state

  neuron.state = neuron.selfconnection.gain * neuron.selfconnection.weight * neuron.state + neuron.bias

  _.each(neuron.connections.inputs, (input) => {
    neuron.state += input.from.activation * input.weight * input.gain
  })

  neuron.activation = neuron.squash(neuron.state)

  neuron.derivative = neuron.squash(neuron.state, true)

  // update traces
  const influences = _.mapValues(neuron.trace.extended, (value, id) => {
    const neighbor = _.get(neuron.neighbors, id)
    // if gated neighbor's selfconnection is gated by this unit, the influence keeps track of the neighbor's old state
    return _.reduce(neuron.trace.influences[id], (result, influence) => {
      result += influence.weight * influence.from.activation
    }, neighbor.selfconnection.gater == this ? neighbor.old : 0)
  })

  _.each(neuron.connections.inputs, (input) => {
    // elegibility trace - Eq. 17
    neuron.trace.elegibility[input.id] = neuron.selfconnection.gain *
      neuron.selfconnection.weight * neuron.trace.elegibility[input.id] + input.gain * input.from.activation

    neuron.trace.extended = _.mapValues(neuron.trace.extended, (xtrace, id) => {
      const neighbor = neuron.neighbors[id]
      const influence = influences[neighbor.id]
      return {
        ...xtrace,
        // eq. 18
        [input.id]: neighbor.selfconnection.gain * neighbor.selfconnection.weight * xtrace[input.id] +
          neuron.derivative * neuron.trace.elegibility[input.id] * influence
      }
    })
  })

  //  update gated connection's gains
  // for (var connection in neuron.connections.gated) {
  //   neuron.connections.gated[connection].gain = neuron.activation;
  // }

  neuron.connections.gated = _.mapValues(neuron.connections.gated, (gate) => ({
    ...gate,
    gain: neuron.activation
  }))

  return neuron.activation
}

export default activate
