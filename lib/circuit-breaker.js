const http = require('http')
const url = require('url')

const debug = require('debug')('circuit-breaker:circuit-breaker')
const CircuitOpenError = require('./circuit-open-error')
const RequestTimeoutError = require('./request-timeout-error')

const REQUEST_TIMEOUT = 1000
const REST_PERIOD = 10000
const FAILURE_THRESHOLD = 10

class CircuitBreaker {

  constructor(origin) {
    this.origin = origin
    this.numFailures = 0
    this.circuitOpen = false
  }

  async request(method, relative, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
      if (this.circuitOpen) {
        reject(new CircuitOpenError(this.origin))
      } else {
        let timeout = null
        const endpoint = `${this.origin}${relative}`
        const options = url.parse(endpoint)
        options.method = method
        options.headers = headers
        const req = http.request(options)
        if (body && body.length > 0) {
          req.write(body)
        }
        req.end()
        req.once('error', (err) => {
          reject(err)
        })
        req.once('response', (res) => {
          let data = null
          res.setEncoding('utf8')
          res.on('error', (err) => {
            reject(err)
          })
          res.on('data', (chunk) => {
            if (data) {
              data = data + chunk
            } else {
              data = chunk
            }
          })
          res.on('end', () => {
            clearTimeout(timeout)
            this.numFailures = 0
            res.data = data
            resolve(res)
          })
        })
        timeout = setTimeout(() => {
          req.abort()
          this.numFailures += 1
          debug(`num failures = ${this.numFailures}`)
          if (this.numFailures >= FAILURE_THRESHOLD) {
            debug('Hit failure threshold')
             this.circuitOpen = true
             setTimeout(() => {
               this.circuitOpen = false
             }, REST_PERIOD)
          }
          reject(new RequestTimeoutError(this.origin, relative))
        }, REQUEST_TIMEOUT)
      }
    })
  }
}

module.exports = CircuitBreaker
