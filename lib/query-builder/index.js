const db = require('./db')

class QueryBuilder {
    constructor(logger, options) {
        this.logger = logger

        let config = {
            client: options.client,
            connection: options.connection
        }

        if (options.pool && Object.entries(options.pool).length) {
            config = {...config, ...options.pool}
        }

        this.connection = db(this.logger, config)
    }

    unwrapDescription(description) {
        let result = description

        if (!result) {
            return result
        }

        if (result.indexOf('```sql\n') === 0) {
            result = result.slice(7)
        }

        if (result.indexOf('\n```') === (result.length - 4)) {
            result = result.slice(0, result.length - 4)
        }

        return result
    }

    async handler(c, ctx) {
        const args = {...c.request.params, ...c.request.query, ...ctx.request.body}

        this.logger.debug(c.operation)

        if (!c.operation.description) {
            ctx.status = 501

            return
        }

        ctx.status = 200
        try {
            this.logger.debug(this.unwrapDescription(c.operation.description), args)
            ctx.body = await this.connection.raw(
                this.unwrapDescription(c.operation.description),
                args
            )
        } catch (error) {
            ctx.body = error
            ctx.status = 500
        }

        this.logger.debug(ctx.body)
    }
}

module.exports = QueryBuilder
