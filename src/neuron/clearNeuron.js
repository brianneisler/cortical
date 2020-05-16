  // clears all the traces (the neuron forgets it's context, but the connections remain intact)
const clear = () => {

  for (var trace in this.trace.elegibility)
    this.trace.elegibility[trace] = 0;

  for (var trace in this.trace.extended)
    for (var extended in this.trace.extended[trace])
      this.trace.extended[trace][extended] = 0;

  this.error.responsibility = this.error.projected = this.error.gated = 0;
}
