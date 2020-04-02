const knex = require('knex') // https://github.com/tgriesser/knex

const PING_QUERY = 'select sysdate from dual'
const RETRY_TIMEOUT = 300
const RETRIES = 3

let logger
let connection
let connectionCounter = 0

const errorNums = [
    'ORA-22',       // invalid session ID; access denied
    'ORA-28',       // your session has been killed
    'ORA-31',       // your session has been marked for kill
    'ORA-45',       // your session has been terminated with no replay
    'ORA-378',      // buffer pools cannot be created as specified
    'ORA-602',      // internal programming exception
    'ORA-603',      // ORACLE server session terminated by fatal error
    'ORA-609',      // could not attach to incoming connection
    'ORA-1012',     // not logged on
    'ORA-1041',     // internal error. hostdef extension doesn't exist
    'ORA-1043',     // user side memory corruption
    'ORA-1089',     // immediate shutdown or close in progress
    'ORA-1092',     // ORACLE instance terminated. Disconnection forced
    'ORA-2396',     // exceeded maximum idle time, please connect again
    'ORA-3122',     // attempt to close ORACLE-side window on user side
    'ORA-03113',    // end-of-file on communication channel
    'ORA-03114',    // not connected to ORACLE
    'ORA-03135',    // connection lost contact
    'ORA-12153',    // TNS'not connected
    'ORA-12514',    // listener does not currently know of service requested in connect descriptor
    'ORA-12505',    // TNS:listener does not currently know of SID given in connect descriptor
    'ORA-12537',    // TNS'connection closed
    'ORA-12541',    // TNS:no listener
    'ORA-12545',    // Connect failed because target host or object does not exist
    'ORA-12547',    // TNS'lost contact
    'ORA-12570',    // TNS'packet reader failure
    'ORA-12583',    // TNS'no reader
    'ORA-27146',    // post/wait initialization failed
    'ORA-28511',    // lost RPC connection
    'ORA-56600',    // an illegal OCI function call was issued
]

function isConnectionError(message) {
    return errorNums.some((prefix) => message.indexOf(prefix) !== -1)
}

function connect(log, config) {
    const handler = {
        get: (_target, propKey) => {
            if (propKey === 'raw') {
                return connect.retryRaw
            }

            if (propKey === 'ping') {
                return connect.ping
            }

            return (...args) => connection[propKey](...args)
        }
    }

    logger = log
    connection = connect.newConnection(config)

    return new Proxy(connection, handler)
}

connect.knex = (config) => {
    return knex(config)
}

connect.newConnection = (config) => {
    connection = connect.knex(config)
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
            connect.newConnection(config)
        }
    })

    connection.ping = connect.ping

    return connection
}

connect.retryRaw = async (...args) => {
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


connect.ping = () => {
    try {
        return connect.retryRaw(PING_QUERY)
    } catch (error) {
        logger.error('Ping fail: ', error.message)
    }

    return []
}

module.exports = { connect, isConnectionError }
