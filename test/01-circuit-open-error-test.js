const vows = require('perjury')
const assert = vows.assert

const debug = require('debug')('circuit-breaker:circuit-open-error-test')

const CircuitOpenError = require('../lib/circuit-open-error')

vows.describe('CircuitOpenError')
  .addBatch({
    'When we create a CircuitOpenError': {
      topic() {
        return new CircuitOpenError('https://api.example')
      },
      'it works': (err, coe) => {
        assert.ifError(err)
        assert.isObject(coe)
        assert.equal(coe.name, 'CircuitOpenError')
        assert.equal(coe.message, 'Too many failed requests to https://api.example')
      }
    }
  })
  .export(module)
