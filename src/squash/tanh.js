const tanh = (x, derivate) => {
  if (derivate) {
    return 1 - Math.pow(tanh(x), 2)
  }
  const eP = Math.exp(x)
  const eN = 1 / eP
  return (eP - eN) / (eP + eN)
}
export default tanh
