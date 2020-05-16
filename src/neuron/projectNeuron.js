project: function(neuron, weight) {
  // self-connection
  if (neuron == this) {
    this.selfconnection.weight = 1;
    return this.selfconnection;
  }

  // check if connection already exists
  var connected = this.connected(neuron);
  if (connected && connected.type == "projected") {
    // update connection
    if (typeof weight != 'undefined')
      connected.connection.weight = weight;
    // return existing connection
    return connected.connection;
  } else {
    // create a new connection
    var connection = new Connection(this, neuron, weight);
  }

  // reference all the connections and traces
  this.connections.projected[connection.id] = connection;
  this.neighboors[neuron.id] = neuron;
  neuron.connections.inputs[connection.id] = connection;
  neuron.trace.elegibility[connection.id] = 0;

  for (var id in neuron.trace.extended) {
    var trace = neuron.trace.extended[id];
    trace[connection.id] = 0;
  }

  return connection;
}
