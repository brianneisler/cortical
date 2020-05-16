import _ from 'mudash'
import uuid from 'uuid'

const createConnection = (from, to, weight = Math.random() * .2 - .1) => {
  if (!from || !to) {
    throw new Error('Connection Error: Invalid neurons')
  }

  return {
    id: uuid(),
    from,
    to,
    weight,
    gain: 1,
    gater: null
  }
}
export default createConnection
