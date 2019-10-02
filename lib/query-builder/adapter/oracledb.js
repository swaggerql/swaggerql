const knex = require('knex') // https://github.com/tgriesser/knex

const RETRY_TIMEOUT = 300
const RETRIES = 3

let connection
let connectionCounter = 0

function isConnectionError(message) {
    return message.indexOf('ORA-03114') !== -1 || message.indexOf('ORA-03135') !== -1
}

function newConnection(logger, config) {
    connection = knex(config)
    connectionCounter += 1

    connection.on('query-error', (error) => {
        // Reconnect when we find a 3114 or 3135 error (until knex issue #2608 is merged)
        if (isConnectionError(error.message)) {
            logger.error(`Encountered ORA-03114/03135 database connection error. Automatically reconnecting (${connectionCounter}).`)
            try {
                connection.destroy()
            } catch (error) {
                logger.debug(error)
            }
            newConnection(logger, config)
        }
    })

    return connection
}

function connect(logger, config) {
    connection = newConnection(logger, config)

    const handler = {
        get: (_target, propKey) => {
            if (propKey === 'raw') {
                return async (...args) => {
                    let retry = RETRIES
                    let done = false
                    let results

                    do {
                        try {
                            results = await connection.raw(...args)
                            done = true
                        } catch (error) {
                            retry -= 1

                            if (!isConnectionError(error.message) || retry < 1) {
                                throw error
                            }

                            logger.info(`Connection lost, sleeping for ${RETRY_TIMEOUT}ms and will retry (${retry})`)
                            await new Promise((resolve) => setTimeout(resolve, RETRY_TIMEOUT)) /* Sleep */
                        }
                    } while (!done && retry > 0)

                    return results
                }
            }

            return (...args) => connection[propKey](...args)
        }
    }

    return new Proxy(connection, handler)
}

module.exports = { connect }
