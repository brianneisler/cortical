//module.exports = require('./dist')
import _ from 'mudash'
import firebase from 'firebase'
import { Architect, Layer, Network, Trainer } from 'synaptic'
import BitArray from 'node-bitarray'
import call from './call'

const namespace = 'main'
const config = {
  apiKey: "AIzaSyA62oznq2WslkUwFD5O7FF8hxn1p4duRPk",
  authDomain: "memzy-72fbf.firebaseapp.com",
  databaseURL: "https://memzy-72fbf.firebaseio.com",
  storageBucket: "memzy-72fbf.appspot.com",
  messagingSenderId: "845981745957"
}
const app = firebase.initializeApp(config)
const database = app.database()


async function main() {
  //const func = () => 6
  // let method = await pushMethod({
  //   func
  // })

  let method = await getMethod('-KVsG3Jd3RffkDYV0EOD')
  //
  // let method = generateMethod({
  //   params: [
  //     { type: 'integer' },
  //     { type: 'integer' }
  //   ],
  //   return: {
  //     type: 'integer'
  //   }
  // })
  // method = await trainMethodWith(method, (input1, input2) => input1 + input2, (() => {
  //   let nums = []
  //   for (var i = 0; i < 10; i++) {
  //     for (var j = 0; j < 10; j++) {
  //       nums.push([i, j])
  //     }
  //   }
  //   return nums
  // })())
  //
  // await pushMethod(method)
  //console.log('method.network:', method.network)
  // await setMethod(method)
  // console.log(method.network.activate([100]))

  console.log('callMethod(method, 5, 3):', await callMethod(method, 5, 3))
  console.log('callMethod(method, 2, 9):', await callMethod(method, 2, 9))
  // const network = new Architect.Perceptron(2,3,1)

  //const output = network.activate([1, 0])
  // console.log(network.toJSON())


  // const A = new Neuron();
  // const B = new Neuron();
  // A.project(B);
  //
  // A.activate(0.5)
  // const output = B.activate()
  // const optimized = B.optimize()
  // console.log('output:', output)
  // console.log('optimized:', optimized)
  // console.log('optimized:', optimized.activation_sentences)
  // console.log('B:', B )
}

function exec({ desc, network }, ...args) {
  const input = convertArgsToInput(args, desc)
  const output = network.activate(input)
  return convertOuputToResult(output, desc) // NOTE BRN: Errors should also be handled here and thrown
}

async function callMethod(method, ...args) {
  return call(exec, {}, method, ...args)
}

async function trainMethodWith(method, func, inputs) {
  let network = method.network ? method.network : generateNetwork(method.desc)
  network.setOptimize(false)
  const trainer = new Trainer(network)
  const trainingSet = await buildTrainingSet(method, func, inputs)
  console.log('trainingSet:', trainingSet)

  try {
    trainer.train(trainingSet, {
      rate: .1,
      iterations: 20000,
      error: .005,
      shuffle: true,
      log: 50,
      cost: Trainer.cost.CROSS_ENTROPY
    })
  } catch(error) {
    console.log('error:', error)
  }

  return {
    ...method,
    network
  }
}

async function buildTrainingSet(method, func, inputs) {
  return await Promise.all(_.map(inputs, async (args) => {
    const result = await func(...args)
    return {
      input: convertArgsToInput(args, method.desc),
      output: converResultToOutput(result, method.desc)
    }
  }))
}

function generateInputs(number) {
  let inputs = []

  // for (let i = 0; i < number; i++) {
  //   inputs.push([_.random(5, true)])
  // }
  // return inputs
}


async function pushMethod(method) {
  const result = database.ref(`${namespace}/methods`).push()
  const id = result.key
  await result.set({
    ...method,
    id,
    //func: method.func.toString(),
    network: method.network ? JSON.stringify(method.network.toJSON()) : null
  })
  return {
    ...method,
    id
  }
}

async function setMethod(method) {
  const data = {
    ...method,
    //func: method.func.toString(),
    network: method.network ? JSON.stringify(method.network.toJSON()) : null
  }
  const ref = database.ref(`${namespace}/methods/${method.id}`)
  await ref.set(data)
}

async function getMethod(id) {
  const snap = await database.ref(`${namespace}/methods/${id}`).once('value')
  const method = snap.val()
  return {
    ...method,
    //func: eval(`(${method.func})`),
    network: method.network ? Network.fromJSON(JSON.parse(method.network)) : null
  }
}

function generateMethod(desc) {
  return {
    desc,
    network: generateNetwork(desc)
  }
}

function convertArgsToInput(args, desc) {
  return _.reduce(desc.params, (input, param, i) => {
    if (param.type === 'boolean') {
      input = _.concat(input, boolToBitArray(args[i]))
    } else if (param.type === 'integer') {
      input = _.concat(input, intTo32BitArray(args[i]))
    }
    return input
  }, [])
}

function convertOuputToResult(output, desc) {
  if (desc.return.type === 'boolean') {
    return neuronArrayToBool(output)
  } else if (desc.return.type === 'integer') {
    return neuronArrayToInt(output)
  }
}

function converResultToOutput(result, desc) {
  if (desc.return.type === 'boolean') {
    return boolToBitArray(result)
  } else if (desc.return.type === 'integer') {
    return intTo32BitArray(result)
  }
}

function generateNetwork(desc) {
  const network = new Network()
  let inputLength = 0
  _.each(desc.params, (param) => {
    if (param.type === 'boolean') {
      inputLength += 1
    } else if (param.type === 'integer') {
      inputLength += 32
    }
  })

  let outputLength = 0
  if (desc.return.type === 'boolean') {
    outputLength += 1
  } else if (desc.return.type === 'integer') {
    outputLength += 32
  }
  const layers = [inputLength + outputLength]
  //return new Architect.Perceptron(1,3,1)
  //TODO BRN: Manually build network based on number of inputs
  //TODO BRN: When the return type is unknown, we need a mechanism for representing the possible outputs that is dynamic
  // const numParams = func.length


  const input = new Layer(inputLength)
  const output = new Layer(outputLength)
  let hidden = [];
  let previous = input;
  _.each(layers, (size) => {
    const layer = new Layer(size)
    hidden.push(layer)
    previous.project(layer)
    previous = layer
  })
  previous.project(output)

  // set layers of the neural network
  network.set({
    input,
    hidden,
    output
  })
  return network
}

// Based on code from Jonas Raoni Soares Silva
// http://jsfromhell.com/classes/binary-parser
function encodeFloat(number) {
  var n = +number,
  status = (n !== n) || n == -Infinity || n == +Infinity ? n : 0,
  exp = 0,
  len = 281, // 2 * 127 + 1 + 23 + 3,
  bin = new Array(len),
  signal = (n = status !== 0 ? 0 : n) < 0,
  n = Math.abs(n),
  intPart = Math.floor(n),
  floatPart = n - intPart,
  i, lastBit, rounded, j, exponent;

  if (status !== 0) {
    if (n !== n) {
      return 0x7fc00000;
    }
    if (n === Infinity) {
      return 0x7f800000;
    }
    if (n === -Infinity) {
      return 0xff800000
    }
  }

  i = len;
  while (i) {
    bin[--i] = 0;
  }

  i = 129;
  while (intPart && i) {
    bin[--i] = intPart % 2;
    intPart = Math.floor(intPart / 2);
  }

  i = 128;
  while (floatPart > 0 && i) {
    (bin[++i] = ((floatPart *= 2) >= 1) - 0) && --floatPart;
  }

  i = -1;
  while (++i < len && !bin[i]);

  if (bin[(lastBit = 22 + (i = (exp = 128 - i) >= -126 && exp <= 127 ? i + 1 : 128 - (exp = -127))) + 1]) {
    if (!(rounded = bin[lastBit])) {
      j = lastBit + 2;
      while (!rounded && j < len) {
        rounded = bin[j++];
      }
    }

    j = lastBit + 1;
    while (rounded && --j >= 0) {
      (bin[j] = !bin[j] - 0) && (rounded = 0);
    }
  }
  i = i - 2 < 0 ? -1 : i - 3;
  while(++i < len && !bin[i]);
  (exp = 128 - i) >= -126 && exp <= 127 ? ++i : exp < -126 && (i = 255, exp = -127);
  (intPart || status !== 0) && (exp = 128, i = 129, status == -Infinity ? signal = 1 : (status !== status) && (bin[i] = 1));

  n = Math.abs(exp + 127);
  exponent = 0;
  j = 0;
  while (j < 8) {
    exponent += (n % 2) << j;
    n >>= 1;
    j++;
  }

  var mantissa = 0;
  n = i + 23;
  for (; i < n; i++) {
    mantissa = (mantissa << 1) + bin[i];
  }
  return ((signal ? 0x80000000 : 0) + (exponent << 23) + mantissa) | 0;
}

// function arrayFromMask (nMask) {
//   // nMask must be between -2147483648 and 2147483647
//   if (nMask > 0x7fffffff || nMask < -0x80000000) {
//     throw new TypeError("arrayFromMask - out of range");
//   }
//   for (var nShifted = nMask, aFromMask = []; nShifted;
//        aFromMask.push(nShifted & 1), nShifted >>>= 1);
//   return aFromMask;
// }

function intTo32BitArray(int) {
  return BitArray.fromNumber(int).fill(32).toJSON()
}

function neuronArrayToInt(array) {
  return new BitArray(_.map(array, neuronToBit)).toNumber()
}

function boolToBitArray(bool) {
  if (bool) {
    return [1]
  }
  return [0]
}

function neuronArrayToBool(array) {
  return !!(neuronToBit(array[0]))
}

function neuronToBit(neuron) {
  return neuron <= 0.1 ? 0 : 1
}

main()
  .then(() => { process.exit() })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
