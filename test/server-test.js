const http = require('http')

const vows = require('perjury')
const assert = vows.assert

const Server = require('./server')

vows.describe('Server')
  .addBatch({
    'When we start the server': {
      topic() {
        const server = new Server('localhost', 2342)
        return server.start()
      },
      'it works': (err, server) => {
        assert.ifError(err)
        assert.isObject(server)
      },
      teardown(server) {
        return server.stop()
      },
      'and we request the reliable endpoint': {
        topic() {
          const start = Date.now()
          http.get('http://localhost:2342/reliable', (res) => {
            this.callback(null, res, Date.now() - start)
          });
        },
        'it works'(err, res, duration) {
          assert.ifError(err)
          assert.isObject(res)
          assert.equal(res.statusCode, 200)
          assert.lesser(duration, 1000)
        }
      },
      'and we request the unreliable endpoint': {
        topic() {
          const start = Date.now()
          http.get('http://localhost:2342/unreliable', (res) => {
            this.callback(null, res, Date.now() - start)
          });
        },
        'it works': (err, res, duration) => {
          assert.ifError(err)
          assert.isObject(res)
          assert.equal(res.statusCode, 200)
          assert.greater(duration, 1000)
        }
      },
      'and we request the server error endpoint': {
        topic() {
          const start = Date.now()
          http.get('http://localhost:2342/server-error', (res) => {
            this.callback(null, res, Date.now() - start)
          });
        },
        'it works': (err, res, duration) => {
          assert.ifError(err)
          assert.isObject(res)
          assert.equal(res.statusCode, 500)
          assert.lesser(duration, 1000)
        }
      },
      'and we request a non-existent endpoint': {
        topic() {
          const start = Date.now()
          http.get('http://localhost:2342/does-not-exist', (res) => {
            this.callback(null, res, Date.now() - start)
          });
        },
        'it works': (err, res, duration) => {
          assert.ifError(err)
          assert.isObject(res)
          assert.equal(res.statusCode, 404)
          assert.lesser(duration, 1000)
        }
      }
    }
  })
  .export(module)
