module.exports = function() {
  var func = arguments[0]
  var context = arguments[1]
  var args = Array.prototype.slice.call(arguments, 2)
  with(context) {
    return func.apply(null, args)
  }
}
