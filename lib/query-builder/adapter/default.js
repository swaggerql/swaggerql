const knex = require('knex') // https://github.com/tgriesser/knex

function connect(logger, config) {
    return knex(config)
}

module.exports = { connect }
