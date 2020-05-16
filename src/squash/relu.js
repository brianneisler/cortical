const relu = (x, derivate) => {
  if (derivate) {
    return x > 0 ? 1 : 0
  }
  return x > 0 ? x : 0
}
export default relu
