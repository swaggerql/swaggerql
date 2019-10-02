const knex = require('knex') // https://github.com/tgriesser/knex

function connect(logger, config) {

    let connection = knex(config)

    connection.on('query-error', (err) => {
        // Reconnect when we find a 3114 error (until knex issue #2608 is merged)
        if (err.message.indexOf(`ORA-03114`) > -1) {
            logger.error(`Encountered ORA-03114 database connection error. Automatically reconnecting.`)
            connection = knex(connectConfig)
        }
    })

    const handler = {
        get: (_target, propKey) => (...args) => connection[propKey](...args),
    }

    return new Proxy(connection, handler)
}

module.exports = { connect }
