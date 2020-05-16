// hardcodes the behaviour of the neuron into an optimized function
optimize: function(optimized, layer) {

  optimized = optimized || {};
  var store_activation = [];
  var store_trace = [];
  var store_propagation = [];
  var varID = optimized.memory || 0;
  var neurons = optimized.neurons || 1;
  var inputs = optimized.inputs || [];
  var targets = optimized.targets || [];
  var outputs = optimized.outputs || [];
  var variables = optimized.variables || {};
  var activation_sentences = optimized.activation_sentences || [];
  var trace_sentences = optimized.trace_sentences || [];
  var propagation_sentences = optimized.propagation_sentences || [];
  var layers = optimized.layers || { __count: 0, __neuron: 0 };

  // allocate sentences
  var allocate = function(store){
    var allocated = layer in layers && store[layers.__count];
    if (!allocated)
    {
      layers.__count = store.push([]) - 1;
      layers[layer] = layers.__count;
    }
  };
  allocate(activation_sentences);
  allocate(trace_sentences);
  allocate(propagation_sentences);
  var currentLayer = layers.__count;

  // get/reserve space in memory by creating a unique ID for a variablel
  var getVar = function() {
    var args = Array.prototype.slice.call(arguments);

    if (args.length == 1) {
      if (args[0] == 'target') {
        var id = 'target_' + targets.length;
        targets.push(varID);
      } else
        var id = args[0];
      if (id in variables)
        return variables[id];
      return variables[id] = {
        value: 0,
        id: varID++
      };
    } else {
      var extended = args.length > 2;
      if (extended)
        var value = args.pop();

      var unit = args.shift();
      var prop = args.pop();

      if (!extended)
        var value = unit[prop];

      var id = prop + '_';
      for (var property in args)
        id += args[property] + '_';
      id += unit.ID;
      if (id in variables)
        return variables[id];

      return variables[id] = {
        value: value,
        id: varID++
      };
    }
  };

  // build sentence
  var buildSentence = function() {
    var args = Array.prototype.slice.call(arguments);
    var store = args.pop();
    var sentence = "";
    for (var i in args)
      if (typeof args[i] == 'string')
        sentence += args[i];
      else
        sentence += 'F[' + args[i].id + ']';

    store.push(sentence + ';');
  };

  // helper to check if an object is empty
  var isEmpty = function(obj) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop))
        return false;
    }
    return true;
  };

  // characteristics of the neuron
  var noProjections = isEmpty(this.connections.projected);
  var noGates = isEmpty(this.connections.gated);
  var isInput = layer == 'input' ? true : isEmpty(this.connections.inputs);
  var isOutput = layer == 'output' ? true : noProjections && noGates;

  // optimize neuron's behaviour
  var rate = getVar('rate');
  var activation = getVar(this, 'activation');
  if (isInput)
    inputs.push(activation.id);
  else {
    activation_sentences[currentLayer].push(store_activation);
    trace_sentences[currentLayer].push(store_trace);
    propagation_sentences[currentLayer].push(store_propagation);
    var old = getVar(this, 'old');
    var state = getVar(this, 'state');
    var bias = getVar(this, 'bias');
    if (this.selfconnection.gater)
      var self_gain = getVar(this.selfconnection, 'gain');
    if (this.selfconnected())
      var self_weight = getVar(this.selfconnection, 'weight');
    buildSentence(old, ' = ', state, store_activation);
    if (this.selfconnected())
      if (this.selfconnection.gater)
        buildSentence(state, ' = ', self_gain, ' * ', self_weight, ' * ',
          state, ' + ', bias, store_activation);
      else
        buildSentence(state, ' = ', self_weight, ' * ', state, ' + ',
          bias, store_activation);
    else
      buildSentence(state, ' = ', bias, store_activation);
    for (var i in this.connections.inputs) {
      var input = this.connections.inputs[i];
      var input_activation = getVar(input.from, 'activation');
      var input_weight = getVar(input, 'weight');
      if (input.gater)
        var input_gain = getVar(input, 'gain');
      if (this.connections.inputs[i].gater)
        buildSentence(state, ' += ', input_activation, ' * ',
          input_weight, ' * ', input_gain, store_activation);
      else
        buildSentence(state, ' += ', input_activation, ' * ',
          input_weight, store_activation);
    }
    var derivative = getVar(this, 'derivative');
    switch (this.squash) {
      case Neuron.squash.LOGISTIC:
        buildSentence(activation, ' = (1 / (1 + Math.exp(-', state, ')))',
          store_activation);
        buildSentence(derivative, ' = ', activation, ' * (1 - ',
          activation, ')', store_activation);
        break;
      case Neuron.squash.TANH:
        var eP = getVar('aux');
        var eN = getVar('aux_2');
        buildSentence(eP, ' = Math.exp(', state, ')', store_activation);
        buildSentence(eN, ' = 1 / ', eP, store_activation);
        buildSentence(activation, ' = (', eP, ' - ', eN, ') / (', eP, ' + ', eN, ')', store_activation);
        buildSentence(derivative, ' = 1 - (', activation, ' * ', activation, ')', store_activation);
        break;
      case Neuron.squash.IDENTITY:
        buildSentence(activation, ' = ', state, store_activation);
        buildSentence(derivative, ' = 1', store_activation);
        break;
      case Neuron.squash.HLIM:
        buildSentence(activation, ' = +(', state, ' > 0)', store_activation);
        buildSentence(derivative, ' = 1', store_activation);
      case Neuron.squash.RELU:
        buildSentence(activation, ' = ', state, ' > 0 ? ', state, ' : 0', store_activation);
        buildSentence(derivative, ' = ', state, ' > 0 ? 1 : 0', store_activation);
        break;
    }

    for (var id in this.trace.extended) {
      // calculate extended elegibility traces in advance

      var neuron = this.neighboors[id];
      var influence = getVar('influences[' + neuron.ID + ']');
      var neuron_old = getVar(neuron, 'old');
      var initialized = false;
      if (neuron.selfconnection.gater == this)
      {
        buildSentence(influence, ' = ', neuron_old, store_trace);
        initialized = true;
      }
      for (var incoming in this.trace.influences[neuron.ID]) {
        var incoming_weight = getVar(this.trace.influences[neuron.ID]
          [incoming], 'weight');
        var incoming_activation = getVar(this.trace.influences[neuron.ID]
          [incoming].from, 'activation');

        if (initialized)
          buildSentence(influence, ' += ', incoming_weight, ' * ', incoming_activation, store_trace);
        else {
          buildSentence(influence, ' = ', incoming_weight, ' * ', incoming_activation, store_trace);
          initialized = true;
        }
      }
    }

    for (var i in this.connections.inputs) {
      var input = this.connections.inputs[i];
      if (input.gater)
        var input_gain = getVar(input, 'gain');
      var input_activation = getVar(input.from, 'activation');
      var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace
        .elegibility[input.ID]);
      if (this.selfconnected()) {
        if (this.selfconnection.gater) {
          if (input.gater)
            buildSentence(trace, ' = ', self_gain, ' * ', self_weight,
              ' * ', trace, ' + ', input_gain, ' * ', input_activation,
              store_trace);
          else
            buildSentence(trace, ' = ', self_gain, ' * ', self_weight,
              ' * ', trace, ' + ', input_activation, store_trace);
        } else {
          if (input.gater)
            buildSentence(trace, ' = ', self_weight, ' * ', trace, ' + ',
              input_gain, ' * ', input_activation, store_trace);
          else
            buildSentence(trace, ' = ', self_weight, ' * ', trace, ' + ',
              input_activation, store_trace);
        }
      } else {
        if (input.gater)
          buildSentence(trace, ' = ', input_gain, ' * ', input_activation,
            store_trace);
        else
          buildSentence(trace, ' = ', input_activation, store_trace);
      }
      for (var id in this.trace.extended) {
        // extended elegibility trace
        var neuron = this.neighboors[id];
        var influence = getVar('influences[' + neuron.ID + ']');

        var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace
          .elegibility[input.ID]);
        var xtrace = getVar(this, 'trace', 'extended', neuron.ID, input.ID,
          this.trace.extended[neuron.ID][input.ID]);
        if (neuron.selfconnected())
          var neuron_self_weight = getVar(neuron.selfconnection, 'weight');
        if (neuron.selfconnection.gater)
          var neuron_self_gain = getVar(neuron.selfconnection, 'gain');
        if (neuron.selfconnected())
          if (neuron.selfconnection.gater)
            buildSentence(xtrace, ' = ', neuron_self_gain, ' * ',
              neuron_self_weight, ' * ', xtrace, ' + ', derivative, ' * ',
              trace, ' * ', influence, store_trace);
          else
            buildSentence(xtrace, ' = ', neuron_self_weight, ' * ',
              xtrace, ' + ', derivative, ' * ', trace, ' * ',
              influence, store_trace);
        else
          buildSentence(xtrace, ' = ', derivative, ' * ', trace, ' * ',
            influence, store_trace);
      }
    }
    for (var connection in this.connections.gated) {
      var gated_gain = getVar(this.connections.gated[connection], 'gain');
      buildSentence(gated_gain, ' = ', activation, store_activation);
    }
  }
  if (!isInput) {
    var responsibility = getVar(this, 'error', 'responsibility', this.error
      .responsibility);
    if (isOutput) {
      var target = getVar('target');
      buildSentence(responsibility, ' = ', target, ' - ', activation,
        store_propagation);
      for (var id in this.connections.inputs) {
        var input = this.connections.inputs[id];
        var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace
          .elegibility[input.ID]);
        var input_weight = getVar(input, 'weight');
        buildSentence(input_weight, ' += ', rate, ' * (', responsibility,
          ' * ', trace, ')', store_propagation);
      }
      outputs.push(activation.id);
    } else {
      if (!noProjections && !noGates) {
        var error = getVar('aux');
        for (var id in this.connections.projected) {
          var connection = this.connections.projected[id];
          var neuron = connection.to;
          var connection_weight = getVar(connection, 'weight');
          var neuron_responsibility = getVar(neuron, 'error',
            'responsibility', neuron.error.responsibility);
          if (connection.gater) {
            var connection_gain = getVar(connection, 'gain');
            buildSentence(error, ' += ', neuron_responsibility, ' * ',
              connection_gain, ' * ', connection_weight,
              store_propagation);
          } else
            buildSentence(error, ' += ', neuron_responsibility, ' * ',
              connection_weight, store_propagation);
        }
        var projected = getVar(this, 'error', 'projected', this.error.projected);
        buildSentence(projected, ' = ', derivative, ' * ', error,
          store_propagation);
        buildSentence(error, ' = 0', store_propagation);
        for (var id in this.trace.extended) {
          var neuron = this.neighboors[id];
          var influence = getVar('aux_2');
          var neuron_old = getVar(neuron, 'old');
          if (neuron.selfconnection.gater == this)
            buildSentence(influence, ' = ', neuron_old, store_propagation);
          else
            buildSentence(influence, ' = 0', store_propagation);
          for (var input in this.trace.influences[neuron.ID]) {
            var connection = this.trace.influences[neuron.ID][input];
            var connection_weight = getVar(connection, 'weight');
            var neuron_activation = getVar(connection.from, 'activation');
            buildSentence(influence, ' += ', connection_weight, ' * ',
              neuron_activation, store_propagation);
          }
          var neuron_responsibility = getVar(neuron, 'error',
            'responsibility', neuron.error.responsibility);
          buildSentence(error, ' += ', neuron_responsibility, ' * ',
            influence, store_propagation);
        }
        var gated = getVar(this, 'error', 'gated', this.error.gated);
        buildSentence(gated, ' = ', derivative, ' * ', error,
          store_propagation);
        buildSentence(responsibility, ' = ', projected, ' + ', gated,
          store_propagation);
        for (var id in this.connections.inputs) {
          var input = this.connections.inputs[id];
          var gradient = getVar('aux');
          var trace = getVar(this, 'trace', 'elegibility', input.ID, this
            .trace.elegibility[input.ID]);
          buildSentence(gradient, ' = ', projected, ' * ', trace,
            store_propagation);
          for (var id in this.trace.extended) {
            var neuron = this.neighboors[id];
            var neuron_responsibility = getVar(neuron, 'error',
              'responsibility', neuron.error.responsibility);
            var xtrace = getVar(this, 'trace', 'extended', neuron.ID,
              input.ID, this.trace.extended[neuron.ID][input.ID]);
            buildSentence(gradient, ' += ', neuron_responsibility, ' * ',
              xtrace, store_propagation);
          }
          var input_weight = getVar(input, 'weight');
          buildSentence(input_weight, ' += ', rate, ' * ', gradient,
            store_propagation);
        }

      } else if (noGates) {
        buildSentence(responsibility, ' = 0', store_propagation);
        for (var id in this.connections.projected) {
          var connection = this.connections.projected[id];
          var neuron = connection.to;
          var connection_weight = getVar(connection, 'weight');
          var neuron_responsibility = getVar(neuron, 'error',
            'responsibility', neuron.error.responsibility);
          if (connection.gater) {
            var connection_gain = getVar(connection, 'gain');
            buildSentence(responsibility, ' += ', neuron_responsibility,
              ' * ', connection_gain, ' * ', connection_weight,
              store_propagation);
          } else
            buildSentence(responsibility, ' += ', neuron_responsibility,
              ' * ', connection_weight, store_propagation);
        }
        buildSentence(responsibility, ' *= ', derivative,
          store_propagation);
        for (var id in this.connections.inputs) {
          var input = this.connections.inputs[id];
          var trace = getVar(this, 'trace', 'elegibility', input.ID, this
            .trace.elegibility[input.ID]);
          var input_weight = getVar(input, 'weight');
          buildSentence(input_weight, ' += ', rate, ' * (',
            responsibility, ' * ', trace, ')', store_propagation);
        }
      } else if (noProjections) {
        buildSentence(responsibility, ' = 0', store_propagation);
        for (var id in this.trace.extended) {
          var neuron = this.neighboors[id];
          var influence = getVar('aux');
          var neuron_old = getVar(neuron, 'old');
          if (neuron.selfconnection.gater == this)
            buildSentence(influence, ' = ', neuron_old, store_propagation);
          else
            buildSentence(influence, ' = 0', store_propagation);
          for (var input in this.trace.influences[neuron.ID]) {
            var connection = this.trace.influences[neuron.ID][input];
            var connection_weight = getVar(connection, 'weight');
            var neuron_activation = getVar(connection.from, 'activation');
            buildSentence(influence, ' += ', connection_weight, ' * ',
              neuron_activation, store_propagation);
          }
          var neuron_responsibility = getVar(neuron, 'error',
            'responsibility', neuron.error.responsibility);
          buildSentence(responsibility, ' += ', neuron_responsibility,
            ' * ', influence, store_propagation);
        }
        buildSentence(responsibility, ' *= ', derivative,
          store_propagation);
        for (var id in this.connections.inputs) {
          var input = this.connections.inputs[id];
          var gradient = getVar('aux');
          buildSentence(gradient, ' = 0', store_propagation);
          for (var id in this.trace.extended) {
            var neuron = this.neighboors[id];
            var neuron_responsibility = getVar(neuron, 'error',
              'responsibility', neuron.error.responsibility);
            var xtrace = getVar(this, 'trace', 'extended', neuron.ID,
              input.ID, this.trace.extended[neuron.ID][input.ID]);
            buildSentence(gradient, ' += ', neuron_responsibility, ' * ',
              xtrace, store_propagation);
          }
          var input_weight = getVar(input, 'weight');
          buildSentence(input_weight, ' += ', rate, ' * ', gradient,
            store_propagation);
        }
      }
    }
    buildSentence(bias, ' += ', rate, ' * ', responsibility,
      store_propagation);
  }
  return {
    memory: varID,
    neurons: neurons + 1,
    inputs: inputs,
    outputs: outputs,
    targets: targets,
    variables: variables,
    activation_sentences: activation_sentences,
    trace_sentences: trace_sentences,
    propagation_sentences: propagation_sentences,
    layers: layers
  }
}
