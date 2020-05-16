import _ from 'mudash'
import uuid from 'uuid'
import createConnection from './createConnection'

const createNeuron = () => {
  const id = uuid()
  return {
    id,
    label: null,
    connections: {
      inputs: {},
      projected: {},
      gated: {}
    },
    error: {
      responsibility: 0,
      projected: 0,
      gated: 0
    },
    trace: {
      elegibility: {},
      extended: {},
      influences: {}
    },
    state: 0,
    old: 0,
    activation: 0,
    selfconnection: createConnection(id, id, 0), // weight = 0 -> not connected
    squash: 'LOGISTIC',
    neighboors: {},
    bias: Math.random() * .2 - .1
  }
}

export default createNeuron
