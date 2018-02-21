const http = require('http')

const debug = require('debug')('circuit-breaker:server')

class Server {
  constructor(address, port) {
    this.address = address
    this.port = port
    this._server = null
  }

  start() {
    return new Promise((resolve, reject) => {
      const onError = (err) => {
        clearListeners()
        reject(err)
      }
      const onListen = () => {
        clearListeners()
        resolve(this)
      }
      const clearListeners = () => {
        this._server.removeListener('error', onError)
        this._server.removeListener('listening', onListen)
      }
      this._server = http.createServer(this.handler.bind(this))
      this._server.on('error', onError)
      this._server.on('listening', onListen)
      this._server.listen(this.port, this.address)
    })
  }

  stop() {
    return new Promise((resolve, reject) => {
      const onError = (err) => {
        clearListeners()
        debug(`Error closing server: ${err.message}`)
        reject(err)
      }
      const onClose = () => {
        this._server = null
        debug(`Server closed`)
        resolve(this)
      }
      const clearListeners = () => {
        this._server.removeListener('error', onError)
        this._server.removeListener('close', onClose)
      }
      this._server.on('error', onError)
      this._server.on('close', onClose)
      this._server.close()
    })
  }

  handler(req, res) {
    debug(req.url)
    switch (req.url) {
      case '/reliable': {
        return this.reliable(req, res)
      }
      case '/unreliable': {
        return this.unreliable(req, res)
      }
      case '/server-error': {
        return this.serverError(req, res)
      }
      default: {
        return this.notFound(req, res)
      }
    }
  }

  reliable(req, res) {
    debug('/reliable')
    res.writeHead(200, 'OK', {'Content-Type': 'text/plain'})
    res.end('OK')
  }

  unreliable(req, res) {
    debug('/unreliable')
    setTimeout(() => {
      res.writeHead(200, 'OK', {'Content-Type': 'text/plain'})
      res.end('OK')
    }, 2000)
  }

  serverError(req, res) {
    debug('/server-error')
    res.writeHead(500, http.STATUS_CODES[500], {'Content-Type': 'text/plain'})
    res.end('Error')
  }

  notFound(req, res) {
    debug('default handler')
    res.writeHead(404, http.STATUS_CODES[404], {'Content-Type': 'text/plain'})
    res.end('No such endpoint')
  }
}

module.exports = Server
