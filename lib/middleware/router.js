const SwaggerParser = require('swagger-parser')
const OpenAPIBackend = require('openapi-backend').default
const knex = require('knex')

class Router {
    constructor(logger, options) {
        const self = this;
        const parser = new SwaggerParser()

        this.logger = logger;

        this.connection = knex({
            client: options.client,
            connection: options.connection
        })

        parser.validate(options.inputSpec)
            .then(() => {
                self.api = new OpenAPIBackend({
                    definition: self.getDefinition(parser.api, options),
                    handlers: {
                        getPing: async (c, ctx) => {ctx.body = ''},
                        getAPIDocs: async (c, ctx) => {ctx.body = parser.api},
                        validationFail: async (c, ctx) => ctx.exception(400, c.validation.errors, 'validation fail'),
                        notFound: async (c, ctx) => ctx.exception(404, 'not found'),
                        notImplemented: self.queryHandler()
                    }
                })

                self.api.init()
            })
            .catch((error) => {
                throw new Error('The API is invalid: ' + error.message)
            })
    }

    getDefinition(api, options) {
        for (const path in api.paths) {
            for (const method in api.paths[path]) {
                const operation = api.paths[path][method]

                /* Generate operationId where not exists */
                if (!operation.operationId) {
                    operation.operationId = `${path}_${method}`.replace(/\W/gu, '_')
                }
                /* Wrap description as code */
                if (operation.description && operation.description.length) {
                    operation.description += (operation.description.charAt(operation.description.length - 1) === '\n')
                        ? '```'
                        : '\n```'
                    operation.description = '```sql\n' + operation.description
                }
            }
        }

        /* Add api-docs handle */
        api.paths[options.swagger.handle] = {
            get: {
                tags: ['infrastructure'],
                summary: 'OpenAPI spec',
                operationId: 'getAPIDocs',
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {type: 'object'}
                            }
                        }
                    }
                }
            }
        }

        /* Add health check handle */
        api.paths['/ping'] = {
            get: {
                tags: ['infrastructure'],
                summary: 'Health Check',
                operationId: 'getPing',
                responses: {
                    '200': {
                        description: 'OK'
                    }
                }
            }
        }

        return api
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

    queryHandler() {
        return async (c, ctx) => {
            const args = {...ctx.request.query}
            console.log(c.operation)

            if (!c.operation.description) {
                ctx.status = 501
                return
            }

            ctx.status = 200
            try {
                console.log(this.unwrapDescription(c.operation.description), args)
                ctx.body = await this.connection.raw(
                    this.unwrapDescription(c.operation.description),
                    args
                )
            } catch (error) {
                ctx.body = error
                ctx.status = 500
            }
            console.log(ctx.body)
        }
    }

    middleware() {
        return async (ctx) => this.api.handleRequest(
            {
                method: ctx.request.method,
                path: ctx.request.path,
                body: ctx.request.body,
                query: ctx.request.query,
                headers: ctx.request.headers
            },
            ctx
        )
    }
}

module.exports = Router
