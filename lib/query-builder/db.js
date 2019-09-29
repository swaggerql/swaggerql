const knex = require('knex') // https://github.com/tgriesser/knex

function db(logger, config) {

    let connection = knex(config)

    connection.on('query-error', (err) => {
        // Reconnect when we find a 3114 error (until knex issue #2608 is merged)
        if (err.message.indexOf(`ORA-03114`) > -1) {
            logger.error(`Encountered ORA-03114 database connection error. Automatically reconnecting.`)
            connection = knex(connectConfig)
        }
    })

    const handler = {
        // Uses the `connection` variable in the module instead of exported instance which is static
        get: (_target, propKey) => (...args) => connection[propKey](...args),
    }

    /*
     * Using Proxy to allow us to intercept method calls and pass them
     * through the `get` interceptor, which points them towards the non-exported
     * `myDb` variable, which will reconnect automatically using the event listener
     *
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
     * http://2ality.com/2015/10/intercepting-method-calls.html
     */
    return new Proxy(connection, handler)
}

module.exports = db
