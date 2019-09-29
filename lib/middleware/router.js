const SwaggerParser = require('swagger-parser') // https://github.com/APIDevTools/swagger-parser
const OpenAPIBackend = require('openapi-backend').default // https://github.com/anttiviljami/openapi-backend
const QueryBuilder = require('../query-builder')

class Router {
    constructor(logger, options) {
        const self = this;
        const parser = new SwaggerParser()
        const queryBuilder = new QueryBuilder(logger, options)

        this.logger = logger

        parser.validate(options.inputSpec)
            .then(() => {
                self.api = new OpenAPIBackend({
                    definition: self.getDefinition(parser.api, options),
                    handlers: {
                        getPing: async (c, ctx) => {ctx.body = ''},
                        getAPIDocs: async (c, ctx) => {ctx.body = parser.api},
                        validationFail: async (c, ctx) => ctx.exception(400, c.validation.errors, 'validation fail'),
                        notFound: async (c, ctx) => ctx.exception(404, 'not found'),
                        notImplemented: async (c, ctx) => queryBuilder.handler(c, ctx)
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
                if (operation.description && operation.description.length && operation.description.indexOf('```sql\n') === -1) {
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
