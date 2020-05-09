//-------------------------------------------------------------------------------
// Imports
//-------------------------------------------------------------------------------

import immutable from 'immutable';


//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

/**
 * @class
 * @extends {Layer}
 */
export default class OuterLayer extends Layer {

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
     * @type {List<Layer>}
     */
    this.subLayerList = immutable.List();
  }


  //-------------------------------------------------------------------------------
  // Getters and Setters
  //-------------------------------------------------------------------------------

  /**
   * @return {List<Layer>}
   */
  getSubLayerList() {
    return this.subLayerList;
  }


  //-------------------------------------------------------------------------------
  // IOuterLayer Implementation
  //-------------------------------------------------------------------------------

  /**
   * @param {Layer} subLayer
   */
  addSubLayer(subLayer) {
      this.subLayerList = this.subLayerList.push(subLayer);
  }

  /**
   *
   */
  removeAllSubLayers() {
    this.subLayerList = this.subLayerList.clear();
  }

  /**
   * @param {Layer} subLayer
   */
  removeSubLayer(subLayer) {
    this.neuralSubLayerList.remove(neuralSubLayer);
    //TODO BRN: the connections between this layer's neurons and the sublayers neurons needs to be separated, but that does not mean that
    //all neurons on the sublayer need to be detached. (could belong to multiple OuterLayers). Plus we don't want those neurons to separate
    // from their children, just the parents that belong to this layer.

  }


  //-------------------------------------------------------------------------------
  // Public Methods
  //-------------------------------------------------------------------------------

  /**
   * @return {boolean}
   */
  hasUsableSubLayers() {
    return this.retrieveAttachedSubLayers().getCount() > 0;
  }

  /**
   * @return {List.<NeuralLayer>}
   */
  retrieveAttachedSubLayers() {
    var subLayerList = this.getNeuralSubLayerList().clone();
    subLayerList.forEach(function(subLayer) {
      if (subLayer.isDetached()) {
        subLayerList.remove(subLayer);
      }
    });
    return subLayerList;
  }

  /**
   * @return {List.<NeuralLayer>}
   */
  retrieveAttachedSubLayersWithNeurons() {
    var subLayerList = this.retrieveAttachedSubLayers();
    subLayerList.forEach(function(subLayer) {
      if (subLayer.getAttachedNeuronList().getCount() <= 0) {
        subLayerList.remove(subLayer);
      }
    });
    return subLayerList;
  }
}
