const logistic = (x, derivate) => {
  if (!derivate) {
    return 1 / (1 + Math.exp(-x))
  }
  const fx = logistic(x)
  return fx * (1 - fx)
}

export default logistic
