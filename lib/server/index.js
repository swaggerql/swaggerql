const Koa = require('koa')
const Swagger = require('koa2-swagger-ui')
const bodyparser = require('koa-bodyparser')
const Exception = require('../middleware/exception')
const Router = require('../middleware/router')

async function run (options) {
    const app = new Koa()
    const exception = new Exception(console)
    const router = new Router(console, options)

    app.use(bodyparser())
        .use(exception.middleware())
        .use(Swagger({
            routePrefix: '/',
            swaggerOptions: {
                url: options.swagger.handle
            }
        }))
        .use(router.middleware())
        .listen(parseInt(options.port), () => console.info(`Start at http://0.0.0.0:${options.port}`))
}

exports.run = run
