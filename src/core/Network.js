//-------------------------------------------------------------------------------
// Imports
//-------------------------------------------------------------------------------

import EventEmitter from 'event-emitter'
import immutable from 'immutable';


//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

/**
 * @class
 * @extends {EventDispatcher}
 */
export default class Network extends EventEmitter {

  //-------------------------------------------------------------------------------
  // Static Properties
  //-------------------------------------------------------------------------------

  /**
   * @static
   * @enum {string}
   */
  static EventTypes = {
    OUTPUT_VALUE: "NeuralNetwork:EventTypes:OutputValue"
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
     * @type {Set<Layer>}
     */
    this.layerSet = immutable.Set();

    /**
     * @private
     * @type {BidiMap.<string. INeuralInput>}
     */
    this.neuralInputBidiMap = Collections.bidiMap();

    /**
     * @private
     * @type {BidiMap.<string. INeuralOutput>}
     */
    this.neuralOutputBidiMap = Collections.bidiMap();

    /**
     * @private
     * @type {NeuronProcessor}
     */
    this.neuronProcessor = new NeuronProcessor();

    this.hearLayerOutputValue = this.hearLayerOutputValue.bind(this);
  }


  //-------------------------------------------------------------------------------
  // Getters and Setters
  //-------------------------------------------------------------------------------

  /**
   * @return {Set.<INeuralConstant>}
   */
  getNeuralConstantLayerSet() {
    return this.neuralConstantLayerSet;
  }

  /**
   * @return {BidiMap.<string., INeuralInput>}
   */
  getNeuralInputBidiMap() {
    return this.neuralInputBidiMap;
  }

  /**
   * @return {BidiMap.<string., INeuralOutput>}
   */
  getNeuralOutputBidiMap() {
    return this.neuralOutputBidiMap;
  }

  /**
   * @return {NeuronProcessor}
   */
  getNeuronProcessor() {
    return this.neuronProcessor;
  }


  //-------------------------------------------------------------------------------
  // Public Methods
  //-------------------------------------------------------------------------------

  /**
   * @param {ConstantLayer} neuralConstantLayer
   */
  addConstantLayer(neuralConstantLayer) {
    if (!Class.doesImplement(neuralConstantLayer, INeuralConstant)) {
      throw Throwables.illegalArgumentBug("neuralConstantLayer", neuralConstantLayer, "neuralConstantLayer must implement INeuralConstant");
    }
    if (!this.neuralConstantLayerSet.contains(neuralConstantLayer)) {
      this.neuralConstantLayerSet.add(neuralConstantLayer);
      neuralConstantLayer.attach();
      neuralConstantLayer.setNeuronProcessor(this.neuronProcessor);
    }
  }

  /**
   * @param {ConstantLayer} neuralConstantLayer
   */
  removeConstantLayer(neuralConstantLayer) {
    if (this.neuralConstantLayerSet.contains(neuralConstantLayer)) {
      this.neuralConstantLayerSet.remove(neuralConstantLayer);
      neuralConstantLayer.detach();
    }
  }

  /**
   * @param {string} name
   * @param {InputLayer} neuralInputLayer
   */
  addInputLayer(name, neuralInputLayer) {
    if (!Class.doesImplement(neuralInputLayer, INeuralInput)) {
      throw Throwables.illegalArgumentBug("neuralInputLayer", neuralInputLayer, "neuralInputLayer must implement INeuralInput");
    }
    if (!this.neuralInputBidiMap.containsKey(name) && !this.neuralInputBidiMap.containsValue(neuralInputLayer)) {
      this.neuralInputBidiMap.put(name, neuralInputLayer);
      neuralInputLayer.attach();
      neuralInputLayer.setNeuronProcessor(this.neuronProcessor);
    }
  }

  /**
   * @param {InputLayer} neuralInputLayer
   */
  removeInputLayer(neuralInputLayer) {
    if (this.neuralInputBidiMap.containsValue(neuralInputLayer)) {
      this.neuralInputBidiMap.removeByValue(neuralInputLayer);
      neuralInputLayer.detach();
    }
  }

  /**
   * @param {INeuralLayer} neuralLayer
   */
  addLayer(neuralLayer) {
    /*if (!this.neuralLayerSet.contains(neuralLayer)) {
     this.neuralInputSet.add(neuralLayer);
     neuralLayer.attach();
     }*/
  }

  /**
   * @param {INeuralLayer} neuralLayer
   */
  removeLayer(neuralLayer) {
    /*if (this.neuralLayerSet.contains(neuralLayer)) {
     this.neuralInputSet.remove(neuralLayer);
     neuralLayer.detach();
     }*/
  }

  /**
   * @param {string} name
   * @param {OutputLayer} neuralOutputLayer
   */
  addOutputLayer(name, neuralOutputLayer) {
    if (!Class.doesImplement(neuralOutputLayer, INeuralOutput)) {
      throw Throwables.illegalArgumentBug("neuralOutputLayer", neuralOutputLayer, "neuralOutputLayer must implement INeuralOutput");
    }
    if (!this.neuralOutputBidiMap.containsKey(name) && !this.neuralOutputBidiMap.containsValue(neuralOutputLayer)) {
      this.neuralOutputBidiMap.put(name, neuralOutputLayer);
      neuralOutputLayer.addEventListener(OutputLayer.EventTypes.OUTPUT_VALUE, this.hearLayerOutputValue, this);
      neuralOutputLayer.attach();
      neuralOutputLayer.setNeuronProcessor(this.neuronProcessor);
    }
  }

  /**
   * @param {INeuralOutput} neuralOutputLayer
   */
  removeOutputLayer(neuralOutputLayer) {
    if (this.neuralOutputBidiMap.containsValue(neuralOutputLayer)) {
      this.neuralOutputBidiMap.removeByValue(neuralOutputLayer);
      neuralOutputLayer.detach();
    }
  }

  /**
   * @param {{
     *      inputs: Object.<string, *>,
     *      outputs: Object.<string, *>
     * }} trainObject
   * @param {function(Throwable=)=} callback
   */
  trainNetwork(trainObject, callback) {
    var _this = this;
    var expectedInputs = this.neuralInputBidiMap.toKeyCollection();
    var expectedOutputs = this.neuralOutputBidiMap.toKeyCollection();
    if (expectedInputs.getCount() === 0) {
      throw Throwables.exception("NetworkRequiresInput", {}, "Must add a NeuralInput before network can be updated");
    }
    if (expectedOutputs.getCount() === 0) {
      throw Throwables.exception("NetworkRequiresOutput", {}, "Must add a NeuralOutput before network can be updated");
    }
    var unknownInputs = Collections.collection();
    var unknownOutputs = Collections.collection();
    var inputs = trainObject.inputs;
    var outputs = trainObject.outputs;

    ObjectUtil.forIn(inputs, function(key, value) {
      if (expectedInputs.contains(key)) {
        expectedInputs.remove(key);
      } else {
        unknownInputs.add(key);
      }
    });

    ObjectUtil.forIn(outputs, function(key, value) {
      if (expectedOutputs.contains(key)) {
        expectedOutputs.remove(key);
      } else {
        unknownOutputs.add(key);
      }
    });

    if (expectedInputs.getCount() > 0) {
      throw Throwables.exception("Missing expected input '" + expectedInputs[0] + "'");
    }
    if (unknownInputs.getCount() > 0) {
      throw Throwables.exception("Unknown input '" + unknownInputs[0] + "'");
    }
    if (expectedOutputs.getCount() > 0) {
      throw Throwables.exception("Missing expected output '" + expectedOutputs[0] + "'");
    }
    if (unknownOutputs.getCount() > 0) {
      throw Throwables.exception("Unknown output '" + unknownOutputs[0] + "'");
    }

    ObjectUtil.forIn(inputs, function(key, value) {
      var neuralInput = _this.neuralInputBidiMap.getValue(key);
      neuralInput.inputValue(value);
    });

    this.neuralConstantLayerSet.forEach(function(neuralConstant) {
      neuralConstant.tickLayer();
    });

    $forInParallel(outputs, function(callback, key, value) {
      var neuralOutput = _this.neuralOutputBidiMap.getValue(key);
      neuralOutput.trainValue(value, callback);
    }).callback(callback);
  }

  /**
   * @param {{
     *      inputs: Object.<string, *>,
     *      outputs: Object.<string, *>
     * }} inputObject
   */
  inputNetwork(inputObject) {
    var _this = this;
    var expectedInputs = this.neuralInputBidiMap.toKeyCollection();
    if (expectedInputs.getCount() === 0) {
      throw Throwables.exception("NetworkRequiresInput", {}, "Must add a NeuralInput before network can be updated");
    }
    var unknownInputs = Collections.collection();
    var inputs = inputObject.inputs;

    ObjectUtil.forIn(inputs, function(key, value) {
      if (expectedInputs.contains(key)) {
        expectedInputs.remove(key);
      } else {
        unknownInputs.add(key);
      }
    });

    if (expectedInputs.getCount() > 0) {
      throw Throwables.exception("Missing expected input '" + expectedInputs[0] + "'");
    }
    if (unknownInputs.getCount() > 0) {
      throw Throwables.exception("Unknown input '" + unknownInputs[0] + "'");
    }

    ObjectUtil.forIn(inputs, function(key, value) {
      var neuralInput = _this.neuralInputBidiMap.getValue(key);
      neuralInput.inputValue(value);
    });

    this.neuralConstantLayerSet.forEach(function(neuralConstant) {
      neuralConstant.tickLayer();
    });
  }


  //-------------------------------------------------------------------------------
  // Event Listeners
  //-------------------------------------------------------------------------------

  /**
   * @private
   * @param {Event} event
   */
  hearLayerOutputValue(event) {
    const tick = event.getData().tick;
    const value = event.getData().value;
    const outputLayer = event.getTarget();
    const name = this.neuralOutputBidiMap.getKey(outputLayer);
    this.dispatchEvent(new Event(Network.EventTypes.OUTPUT_VALUE, {
      tick,
      value,
      outputLayer,
      name
    }));
  }
}
