const adapter = require('./adapter')

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

        this.connection = adapter.connect(this.logger, config)
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
            const sql = this.unwrapQuery(c.operation.description)

            /* eslint require-atomic-updates: off */
            ctx.body = ctx.get('x-transaction') === 'true'
                ? await this.runTransaction(sql, args)
                : await this.runQuery(sql, args)
        } catch (error) {
            ctx.exception(500, 'Query error', error.toString())
        }

        this.logger.debug(ctx.body)
    }

    runQuery(sql, args) {

        /*
            sql logic simplification :
            when used within LIKE statements for example, empty variables are useless,
            and produced overweighted sql queries for nothing.

            if a line starts with "#:variable ...." if "variable" will be an empty string, we will remove such line.

            example :
            args = { 'firstname': '', 'lastname': 'zzz' }
            sql = """
                SELECT * FROM table WHERE 1
                #:firstname   AND firstname LIKE CONCAT('%', :firstname, '%')
                #:lastname    AND lastname LIKE CONCAT('%', :lastname, '%')
            """

            the sql variable will be rewritten into
            sql = """
                SELECT * FROM table WHERE 1
                #:firstname   AND firstname LIKE CONCAT('%', :firstname, '%')
                    AND lastname LIKE CONCAT('%', :lastname, '%')
            """
            keeping comment on "#:firstname " line, and removing the comment on "#:lastname " line
        */
        var sqlLines = sql.match(/[^\r\n]+/g)
        for (const line in [...sqlLines.keys()]) {
            if (sqlLines[line].startsWith("#:")) {
                try {
                    var vargs = args[sqlLines[line].split(' ')[0].substring(2)]
                    if (vargs !== "" && typeof vargs !== 'undefined'){
                        sqlLines[line] = sqlLines[line].substring(sqlLines[line].indexOf(' '))
                    }
                } catch (error) {
                    this.logger.info("commented variable misunderstood " + sqlLines[line])
                }
            }
        }
        sql = sqlLines.join('\n')
        this.logger.debug(sql)
        return this.connection.raw(sql, args)
    }

    async runTransaction(sql, args) {
        // We need test a connection because all queries within a transaction
        // are executed on the same database connection.
        if (typeof this.connection.ping === 'function') {
            await this.connection.ping()
        }

        return this.connection.transaction((trx) =>{
            return trx.raw(sql, args).transacting(trx)
        })
    }
}

module.exports = QueryBuilder
