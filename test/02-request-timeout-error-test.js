const vows = require('perjury')
const assert = vows.assert

const debug = require('debug')('circuit-breaker:request-timeout-error-test')

const RequestTimeoutError = require('../lib/request-timeout-error')

vows.describe('RequestTimeoutError')
  .addBatch({
    'When we create a RequestTimeoutError': {
      topic() {
        return new RequestTimeoutError('https://api.example', '/foo')
      },
      'it works': (err, rte) => {
        assert.ifError(err)
        assert.isObject(rte)
        assert.equal(rte.name, 'RequestTimeoutError')
        assert.equal(rte.message, 'Timeout on request to https://api.example/foo')
      }
    }
  })
  .export(module)
