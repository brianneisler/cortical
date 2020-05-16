
// back-propagate the error
const propagate = (rate, target) => {
  // error accumulator
  let error = 0

  // whether or not this neuron is in the output layer
  const isOutput = typeof target != 'undefined'

  // output neurons get their error from the enviroment
  if (isOutput) {
    this.error.responsibility = this.error.projected = target - this.activation // Eq. 10
  } else {
    // the rest of the neuron compute their error responsibilities by backpropagation
    // error responsibilities from all the connections projected from this neuron
    for (var id in this.connections.projected) {
      var connection = this.connections.projected[id];
      var neuron = connection.to;
      // Eq. 21
      error += neuron.error.responsibility * connection.gain * connection.weight;
    }

    // projected error responsibility
    this.error.projected = this.derivative * error;

    error = 0;
    // error responsibilities from all the connections gated by this neuron
    for (var id in this.trace.extended) {
      var neuron = this.neighboors[id]; // gated neuron
      var influence = neuron.selfconnection.gater == this ? neuron.old : 0; // if gated neuron's selfconnection is gated by this neuron

      // index runs over all the connections to the gated neuron that are gated by this neuron
      for (var input in this.trace.influences[id]) { // captures the effect that the input connection of this neuron have, on a neuron which its input/s is/are gated by this neuron
        influence += this.trace.influences[id][input].weight * this.trace.influences[
          neuron.id][input].from.activation;
      }
      // eq. 22
      error += neuron.error.responsibility * influence;
    }

    // gated error responsibility
    this.error.gated = this.derivative * error;

    // error responsibility - Eq. 23
    this.error.responsibility = this.error.projected + this.error.gated;
  }

  // learning rate
  rate = rate || .1;

  // adjust all the neuron's incoming connections
  for (var id in this.connections.inputs) {
    var input = this.connections.inputs[id];

    // Eq. 24
    var gradient = this.error.projected * this.trace.elegibility[input.id];
    for (var id in this.trace.extended) {
      var neuron = this.neighboors[id];
      gradient += neuron.error.responsibility * this.trace.extended[
        neuron.id][input.id];
    }
    input.weight += rate * gradient; // adjust weights - aka learn
  }

  // adjust bias
  this.bias += rate * this.error.responsibility;
}
