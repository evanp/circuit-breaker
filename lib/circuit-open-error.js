class CircuitOpenError extends Error {
  constructor(origin) {
    super(`Too many failed requests to ${origin}`)
    this.origin = origin
    this.name = 'CircuitOpenError'
  }
}

module.exports = CircuitOpenError
