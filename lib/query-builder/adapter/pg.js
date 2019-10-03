const knex = require('knex') // https://github.com/tgriesser/knex

function connect(logger, config) {
    const connection = knex(config)

    const handler = {
        get: (_target, propKey) => {
            if (propKey === 'raw') {
                return async (...args) => {
                    const result = await _target.raw(...args)

                    if (result.command === 'SELECT') {
                        return result.rows
                    }

                    if (['INSERT', 'UPDATE', 'DELETE'].includes(result.command)) {
                        return {
                            rowCount: result.rowCount,
                            rows: result.rows
                        }
                    }

                    return result
                }
            }

            return (...args) => _target[propKey](...args)
        }
    }

    return new Proxy(connection, handler)
}

module.exports = { connect }
