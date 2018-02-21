const vows = require('perjury')
const assert = vows.assert

const debug = require('debug')('circuit-breaker:circuit-breaker-test')

const Server = require('./server')
const CircuitBreaker = require('../lib/circuit-breaker')

const failCorrectly = (breaker, method, relative, name) => {
  return new Promise((resolve, reject) => {
    breaker.request(method, relative)
      .then((body) => {
        reject(new Error('Unexpected success'))
      })
      .catch((err) => {
        if (err.name === name) {
          resolve()
        } else {
          reject(err)
        }
      })
  })
}

vows.describe('CircuitBreaker')
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
      'and we create a circuit breaker': {
        topic() {
          return new CircuitBreaker('http://localhost:2342')
        },
        'it works': (err, breaker) => {
          assert.ifError(err)
          assert.isObject(breaker)
        },
        'and we make a request that generates an HTTP error': {
          topic(breaker) {
            return breaker.request('GET', '/server-error')
          },
          'it works': (err, res) => {
            assert.ifError(err)
            assert.isObject(res)
            assert.equal(res.statusCode, 500)
            assert.isString(res.data)
            assert.equal(res.data, 'Error')
          }
        },
        'and we make a reliable request': {
          topic(breaker) {
            return breaker.request('GET', '/reliable')
          },
          'it works': (err, res) => {
            assert.ifError(err)
            assert.isObject(res)
            assert.equal(res.statusCode, 200)
            assert.isString(res.data)
            assert.equal(res.data, 'OK')
          },
          'and we make an unreliable request': {
            topic(res, breaker) {
              return failCorrectly(breaker, 'GET', '/unreliable', 'RequestTimeoutError')
            },
            'it fails correctly': (err) => {
              assert.ifError(err)
            },
            'and we make 9 more unreliable requests': {
              topic(ignore, res, breaker) {
                const promises = []
                for (let i = 0; i < 9; i++) {
                  promises.push(failCorrectly(breaker, 'GET', '/unreliable', 'RequestTimeoutError'))
                }
                return Promise.all(promises)
              },
              'it works': (err) => {
                assert.ifError(err)
              },
              'and we make a reliable request': {
                topic(ignore, ignore2, res, breaker) {
                  return failCorrectly(breaker, 'GET', '/reliable', 'CircuitOpenError')
                },
                'it works': (err) => {
                  assert.ifError(err)
                },
                'and we wait 10 seconds plus 1': {
                  topic() {
                    return new Promise((resolve, reject) => {
                      setTimeout(resolve, 11000)
                    })
                  },
                  'it works': (err) => {
                    assert.ifError(err)
                  },
                  'and we make a reliable request': {
                    topic(ignore, ignore2, ignore3, ignore4, res, breaker) {
                      return breaker.request('GET', '/reliable')
                    },
                    'it works': (err, res) => {
                      assert.ifError(err)
                      assert.isObject(res)
                      assert.equal(res.statusCode, 200)
                      assert.isString(res.data)
                      assert.equal(res.data, 'OK')
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  .export(module)
