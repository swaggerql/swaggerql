function connect(logger, config) {
    if (typeof config.client !== 'string' || config.client === '') {
        throw new Error('BD client must be defined')
    }

    if (['mysql2', 'oracledb', 'pg'].includes(config.client)) {
        return require(`./${config.client}`).connect(logger, config)
    }

    return require('./default').connect(logger, config)
}

module.exports = { connect }
