//-------------------------------------------------------------------------------
// Imports
//-------------------------------------------------------------------------------


//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

/**
 * @class
 * @extends {OuterLayer}
 * @template I
 */
export default class OutputLayer extends OuterLayer {

  //-------------------------------------------------------------------------------
  // Static Properties
  //-------------------------------------------------------------------------------

  /**
   * @static
   * @enum {string}
   */
  static EventTypes = {
    OUTPUT_VALUE: 'OutputLayer:EventTypes:OutputValue'
  };


  //-------------------------------------------------------------------------------
  // Constructor
  //-------------------------------------------------------------------------------

  /**
   * @constructs
   */
  constructor() {

    super();


    //-------------------------------------------------------------------------------
    // Private Properties
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @type {number}
     */
    this.currentTick = -1;

    /**
     * @private
     * @type {number}
     */
    this.currentTrainingTick = -1;

    /**
     * @private
     * @type {Map.<number, I>}
     */
    this.tickToOutputValueMap = Collections.map();

    /**
     * @private
     * @type {Map.<number, I>}
     */
    this.tickToTrainingValueMap = Collections.map();
  }


  //-------------------------------------------------------------------------------
  // Getters and Setters
  //-------------------------------------------------------------------------------

  /**
   * @return {number}
   */
  getCurrentTick() {
    return this.currentTick;
  }

  /**
   * @return {number}
   */
  getCurrentTrainingTick() {
    return this.currentTrainingTick;
  }

  /**
   * @return {Map.<number, I>}
   */
  getTickToOutputValueMap() {
    return this.tickToOutputValueMap;
  }

  /**
   * @return {Map.<number, I>}
   */
  getTickToTrainingValueMap() {
    return this.tickToTrainingValueMap;
  }


  //-------------------------------------------------------------------------------
  // INeuralOutput Implementation
  //-------------------------------------------------------------------------------

  /**
   * @param {number} tick
   * @return {I}
   */
  getOutputValueForTick(tick) {
    if (this.hasOutputValueForTick(tick)) {
      return this.tickToOutputValueMap.get(tick);
    }
    throw Throwables.exception('HasNotTicked', {}, 'No value found for tick '' + tick + ''');

  }

  /**
   * @param {number} tick
   * @return {boolean}
   */
  hasOutputValueForTick(tick) {
    return this.tickToOutputValueMap.containsKey(tick);
  }

  /**
   * @param {I} value
   * @param {function(Throwable=)=} callback
   */
  trainValue(value, callback) {
    this.doTrainValue(value, callback);
  }


  //-------------------------------------------------------------------------------
  // NeuralLayer Methods
  //-------------------------------------------------------------------------------

  /**
   * @protected
   * @param {Neuron} neuron
   */
  doAddNeuron(neuron) {
    this._super(neuron);
    neuron.addEventListener(Neuron.EventTypes.TICK, this.hearNeuronTick, this);
  }

  /**
   * @return {boolean}
   */
  doStimulateGrowth() {
    return false;
  }

  /**
   * @protected
   * @return {Neuron}
   */
  generateNeuron() {
    return new OutputNeuron(this);
  }


  //-------------------------------------------------------------------------------
  // Abstract Protected Methods
  //-------------------------------------------------------------------------------

  /**
   * @abstract
   * @protected
   * @param {I} value
   * @return {string}
   */
  doCalculateBinaryFromValue(value) {
    throw Throwables.bug('AbstractMethodNotImplemented', {}, 'Must implement OutputLayer.doCalculateBinaryFromValue');
  }

  /**
   * @abstract
   * @protected
   * @param {number} tick
   * @return {I}
   */
  doCalculateValueForTick(tick) {
    throw Throwables.bug('AbstractMethodNotImplemented', {}, 'Must implement OutputLayer.doCalculateValueForTick');
  }


  //-------------------------------------------------------------------------------
  // Protected Methods
  //-------------------------------------------------------------------------------

  /**
   * @protected
   */
  doOutputValue() {
    this.currentTick++;
    var value = this.doCalculateValueForTick(this.currentTick);
    this.tickToOutputValueMap.put(this.currentTick, value);
    this.dispatchEvent(new Event(OutputLayer.EventTypes.OUTPUT_VALUE, {value: value, tick: this.currentTick}));
  }

  /**
   * @protected
   * @param {I} value
   * @param {function(Throwable=)=} callback
   */
  doTrainValue(value, callback) {
    this.currentTrainingTick++;
    this.tickToTrainingValueMap.put(this.currentTrainingTick, value);
    var binary = this.doCalculateBinaryFromValue(value);
    this.doTrainNeuronsForTick(this.currentTrainingTick, binary, callback);
  }

  /**
   * @protected
   * @param {number} tick
   * @param {string} binaryString
   * @param {function(Throwable=)=} callback
   */
  doTrainNeuronsForTick(tick, binaryString, callback) {
    var lengthOfInput = binaryString.length;
    this.growLayerToSize(lengthOfInput);

    $forEachParallel(this.getNeuronList(), function(callback, neuron, i) {
      /** @type {OutputNeuron} */
      var outputNeuron = /** @type {OutputNeuron} */neuron;
      var bit = 0;
      if (i < lengthOfInput) {
        bit = parseInt(binaryString[lengthOfInput - i - 1]);
      }
      outputNeuron.feedNeuronTrainingBitForTick(bit, tick, callback);
    }).callback(callback);
  }


  //-------------------------------------------------------------------------------
  // Private Methods
  //-------------------------------------------------------------------------------

  /**
   * @private
   */
  checkAndProcessReadyToOutputValue() {
    if (this.isReadyToOutputValue()) {
      this.doOutputValue();
    }
  }

  /**
   * @private
   * @return {boolean}
   */
  isReadyToOutputValue() {
    var nextTick = this.currentTick + 1;
    var iterator = this.getNeuronList().iterator();
    while (iterator.hasNext()) {
      var neuron = iterator.nextValue();
      if (neuron.getCurrentTick() < nextTick) {
        return false;
      }
    }
    return true;
  }


  //-------------------------------------------------------------------------------
  // Event Listeners
  //-------------------------------------------------------------------------------

  /**
   * @private
   * @param {Event} event
   */
  hearNeuronTick(event) {
    var neuron = event.getData().neuron;
    var neuronTick = neuron.getCurrentTick();

    //NOTE BRN: We only need to check if our output value is ready to process if this is the next tick in the sequence. Otherwise it's a future tick and does not need to be looked at...
    if (neuronTick === this.currentTick + 1) {
      this.checkAndProcessReadyToOutputValue();
    }
  }
}
