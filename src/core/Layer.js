//-------------------------------------------------------------------------------
// Imports
//-------------------------------------------------------------------------------

import immutable from 'immutable';
import bugjs from 'bug-js';


//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

/**
 * @class
 * @extends {EventEmitter}
 */
export default class Layer extends EventEmitter {

  //-------------------------------------------------------------------------------
  // Static Properties
  //-------------------------------------------------------------------------------

  /**
   * @static
   * @enum {string}
   */
  static AttachmentState = {
    ATTACHED: "NeuralLayer:AttachmentState:Attached",
    DETACHED: "NeuralLayer:AttachmentState:Detached"
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
     * @type {List<Neuron>}
     */
    this.attachedNeuronList = immutable.List();

    /**
     * @private
     * @type {Layer.AttachmentState}
     */
    this.attachmentState = Layer.AttachmentState.DETACHED;

    /**
     * @private
     * @type {List<Neuron>}
     */
    this.neuronList = immutable.List();

    /**
     * @private
     * @type {NeuronProcessor}
     */
    this.neuronProcessor = null;


    this.hearNeuronAttached = this.hearNeuronAttached.bind(this);
    this.hearNeuronDetached = this.hearNeuronDetached.bind(this);
  }


  //-------------------------------------------------------------------------------
  // Getters and Setters
  //-------------------------------------------------------------------------------

  /**
   * @return {List<Neuron>}
   */
  getAttachedNeuronList() {
    return this.attachedNeuronList;
  }

  /**
   * @return {Layer.AttachmentState}
   */
  getAttachmentState() {
    return this.attachmentState;
  }

  /**
   * @return {List<Neuron>}
   */
  getNeuronList() {
    return this.neuronList;
  }

  /**
   * @return {NeuronProcessor}
   */
  getNeuronProcessor() {
    return this.neuronProcessor;
  }

  /**
   * @param {NeuronProcessor} neuronProcessor
   */
  setNeuronProcessor(neuronProcessor) {
    if (this.neuronProcessor) {
      this.neuronProcessor.removeAllNeurons(this.neuronList);
    }
    this.neuronProcessor = neuronProcessor;
    this.neuronProcessor.addAllNeurons(this.neuronList);
  }


  //-------------------------------------------------------------------------------
  // Convenience Methods
  //-------------------------------------------------------------------------------

  /**
   * @return {boolean}
   */
  isAttached() {
    return this.attachmentState === Layer.AttachmentState.ATTACHED;
  }

  /**
   * @return {boolean}
   */
  isDetached() {
    return this.attachmentState === Layer.AttachmentState.DETACHED;
  }


  //-------------------------------------------------------------------------------
  // Public Methods
  //-------------------------------------------------------------------------------

  /**
   * @param {number} bit
   * @param {number} tick
   * @return {Set<Neuron>}
   */
  retrieveAttachedNeuronsWithBitAtTick(bit, tick) {
    var neuronSet = immutable.Set();
    this.attachedNeuronList.forEach((neuron) => {
      if (neuron.hasBitForTick(tick)) {
        if (neuron.getBitForTick(tick) === bit) {
          neuronSet.add(neuron);
        }
      }
    });
    return neuronSet;
  }


  //-------------------------------------------------------------------------------
  // INeuralLayer Implementation
  //-------------------------------------------------------------------------------

  /**
   *
   */
  attach() {
    if (this.isDetached()) {
      this.attachmentState = Layer.AttachmentState.ATTACHED;
      this.neuronList.forEach((neuron) => {
        neuron.attach();
      });
    }
  }

  /**
   *
   */
  detach() {
    if (this.isAttached()) {
      this.attachmentState = Layer.AttachmentState.DETACHED;
      this.neuronList.forEach((neuron) => {
        neuron.detach();
      });
      this.neuronProcessor = null;
    }
  }


  /**
   * @param {function(INeuron, number)} func
   */
  forEachNeuron(func) {
    this.neuronList.forEach(func);
  }

  /**
   * @param {number} index
   * @return {INeuron}
   */
  getNeuronAt(index) {
    return this.neuronList.getAt(index);
  }

  /**
   * @return {number}
   */
  getNeuronCount() {
    return this.neuronList.getCount();
  }

  /**
   * @param {number} size
   */
  growLayerToSize(size) {
    var neuronCount = this.getNeuronCount();
    if (neuronCount < size) {
      for (let i = neuronCount; i < size; i++) {
        const neuron = this.generateNeuron();
        this.addNeuron(neuron);
      }
      this.dispatchEvent(new LayerEvent(LayerEvent.EventTypes.GROW, {
        neuralLayer: this
      }));
    }
  }

  /**
   * @return {boolean}
   */
  stimulateGrowth() {
    return this.doStimulateGrowth();
  }


  //-------------------------------------------------------------------------------
  // Abstract Protected Methods
  //-------------------------------------------------------------------------------

  /**
   * @abstract
   * @protected
   * @return {boolean}
   */
  doStimulateGrowth() {
    throw bugjs.bug("AbstractMethodNotImplemented", {}, "Must implement NeuralLayer.doStimulateGrowth");
  }

  /**
   * @abstract
   * @protected
   * @return {Neuron}
   */
  generateNeuron() {
    throw bugjs.bug("AbstractMethodNotImplemented", {}, "Must implement NeuralLayer.generateNeuron");
  }


  //-------------------------------------------------------------------------------
  // Protected Methods
  //-------------------------------------------------------------------------------

  /**
   * @protected
   * @param {Neuron} neuron
   */
  addNeuron(neuron) {
    if (!this.neuronList.contains(neuron)) {
      this.doAddNeuron(neuron);
    }
  }

  /**
   * @protected
   * @param {Neuron} neuron
   */
  doAddNeuron(neuron) {
    this.neuronList.add(neuron);
    if (this.neuronProcessor) {
      this.neuronProcessor.addNeuron(neuron);
    }
    neuron.addEventListener(Neuron.EventTypes.ATTACHED, this.hearNeuronAttached, this);
    neuron.addEventListener(Neuron.EventTypes.DETACHED, this.hearNeuronDetached, this);
    if (neuron.isAttached()) {
      neuron.detach();
    }
    if (this.isAttached()) {
      neuron.attach();
    }
  }

  /**
   * @protected
   * @param {INeuron} neuron
   */
  doAttachNeuron(neuron) {
    this.attachedNeuronList.add(neuron);
  }

  /**
   * @protected
   * @param {INeuron} neuron
   */
  doDetachNeuron(neuron) {
    this.attachedNeuronList.remove(neuron);
  }

  /**
   * @protected
   * @param {Neuron} neuron
   */
  doRemoveNeuron(neuron) {
    this.neuronList.remove(neuron);
    if (this.neuronProcessor) {
      this.neuronProcessor.removeNeuron(neuron);
    }
    if (neuron.isAttached()) {
      neuron.detach();
    }
    neuron.removeListener(Neuron.EventTypes.ATTACHED, this.hearNeuronAttached);
    neuron.removeListener(Neuron.EventTypes.DETACHED, this.hearNeuronDetached);
  }

  /**
   * @protected
   * @param {Neuron} neuron
   */
  removeNeuron(neuron) {
    if (this.neuronList.contains(neuron)) {
      this.doRemoveNeuron(neuron);
    }
  }


  //-------------------------------------------------------------------------------
  // Event Listeners
  //-------------------------------------------------------------------------------

  /**
   * @private
   * @param {Event} event
   */
  hearNeuronAttached(event) {
    var neuron = event.getData().neuron;
    this.doAttachNeuron(neuron);
  }

  /**
   * @private
   * @param {Event} event
   */
  hearNeuronDetached(event) {
    var neuron = event.getData().neuron;
    this.doDetachNeuron(neuron);
  }
}
