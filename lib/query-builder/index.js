const db = require('./adapter')

const QUERY_WRAP_FRONT = '```sql\n'
const QUERY_WRAP_REAR = '\n```'

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

        this.connection = db.connect(this.logger, config)
    }

    hasWrappedQuery(text) {
        if (typeof text !== 'string') {
            return false
        }

        const queryBegin = text.indexOf(QUERY_WRAP_FRONT)
        const queryEnd = text.lastIndexOf(QUERY_WRAP_REAR)

        if (queryBegin === -1 || queryEnd === -1 || queryBegin === (queryEnd + 1)) {
            return false
        }

        return true
    }

    wrapQuery(text) {
        if (typeof text !== 'string') {
            return ''
        }

        if (this.hasWrappedQuery(text)
            || !text.length
            || text.indexOf(QUERY_WRAP_FRONT) !== -1
            || text.lastIndexOf(QUERY_WRAP_REAR) !== -1) {
            return text
        }

        let result = text

        // check if text ended new line
        result += (text.charAt(text.length - 1) === QUERY_WRAP_REAR.charAt(0))
            ? QUERY_WRAP_REAR.slice(1)
            : QUERY_WRAP_REAR

        return QUERY_WRAP_FRONT + result
    }

    unwrapQuery(text) {
        if (typeof text !== 'string' || !text.length || !this.hasWrappedQuery(text)) {
            this.logger.error(`Not exists of sql wrappers`)

            return ''
        }

        const queryBegin = text.indexOf(QUERY_WRAP_FRONT)
        const queryEnd = text.lastIndexOf(QUERY_WRAP_REAR)

        return text.slice(queryBegin + QUERY_WRAP_FRONT.length, queryEnd)
    }

    async handler(c, ctx) {
        const args = {...c.request.params, ...c.request.query, ...ctx.request.body}

        this.logger.debug(c.operation)

        if (!c.operation.description) {
            ctx.exception(501, 'Query is not implemented')

            return
        }

        ctx.status = 200
        try {
            ctx.body = await this.connection.raw(
                this.unwrapQuery(c.operation.description),
                args
            )
        } catch (error) {
            ctx.exception(500, 'Query error', error.toString())
        }

        this.logger.debug(ctx.body)
    }
}

module.exports = QueryBuilder
