//-------------------------------------------------------------------------------
// Imports
//-------------------------------------------------------------------------------

import { Layer } from '../core';


//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

/**
 * @class
 * @extends {Layer}
 */
export default class LogicLayer  extends Layer {

  //-------------------------------------------------------------------------------
  // Layer Methods
  //-------------------------------------------------------------------------------

  /**
   * @protected
   * @return {boolean}
   */
  doStimulateGrowth() {
    //TODO BRN: We can control rates of growth here. For now simply growing in groups of 5.
    const currentSize = this.getNeuronCount();
    this.growLayerToSize(currentSize + 5);
    return true;
  }

  /**
   * @protected
   * @return {Neuron}
   */
  generateNeuron() {
    return new LogicNeuron(this);
  }
}
