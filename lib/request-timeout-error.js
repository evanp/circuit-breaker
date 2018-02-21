class RequestTimeoutError extends Error {
  constructor(origin, relative) {
    super(`Timeout on request to ${origin}${relative}`)
    this.origin = origin
    this.relative = relative
    this.name = 'RequestTimeoutError'
  }
}

module.exports = RequestTimeoutError
