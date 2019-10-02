const knex = require('knex') // https://github.com/tgriesser/knex

function connect(logger, config) {

    if (typeof config.client !== 'string' || config.client === '') {
        throw new Error('BD client must be set')
    }

    if (config.client === 'oracledb') {
        return require('./oracledb').connect(logger, config)
    }

    if (config.client === 'mysql2') {
        return require('./mysql2').connect(logger, config)
    }

    return knex(config)
}

module.exports = { connect }
