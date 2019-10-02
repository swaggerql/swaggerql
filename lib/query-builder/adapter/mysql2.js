const knex = require('knex') // https://github.com/tgriesser/knex

function connect(logger, config) {
    const connection = knex(config)

    const handler = {
        get: (_target, propKey) => {
            if (propKey === 'raw') {
                return async (...args) => {
                    const results = await _target.raw(...args)

                    if (results instanceof Array && results.length) {
                        return results.shift()
                    }

                    return results
                }
            }
            return (...args) => _target[propKey](...args)
        }
    }

    return new Proxy(connection, handler)
}

module.exports = { connect }
