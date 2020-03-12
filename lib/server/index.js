const Koa = require('koa')
const Swagger = require('koa2-swagger-ui')
const bodyparser = require('koa-bodyparser')
const Exception = require('../middleware/exception')
const Router = require('../middleware/router')
const logger = require('loglevel')

async function run (options) {
    logger.setLevel(options.logLevel)

    const app = new Koa()
    const exception = new Exception(logger)
    const router = new Router(logger, options)

    app.use(bodyparser())
        .use(exception.middleware())
        .use(Swagger({
            routePrefix: '/',
            swaggerOptions: {
                url: options.swagger.handle
            }
        }))
        .use(router.middleware())
        .listen(parseInt(options.port), () => logger.info(`Start at http://0.0.0.0:${options.port}`))
}

exports.run = run
