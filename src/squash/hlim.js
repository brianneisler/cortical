const hlim = (x, derivate) => {
  return derivate ? 1 : x > 0 ? 1 : 0
}
export default hlim
