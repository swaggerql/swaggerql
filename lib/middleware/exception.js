/**
 * Формат відповіді з помилкою.
 */
class Exception {
    constructor(logger) {
        this.logger = logger
    }

    middleware() {
        return async (ctx, next) => {
            const that = this
            ctx.exception = (code, error, message = '') => {
                ctx.status = code
                ctx.body = errorMessage(code, error, message)
                that.logger.error(
                    `ERROR: ${code}, ${typeof error === 'string' ? error : JSON.stringify(error)}`
                    + (message ? `; ${message}` : ''))
            }
            await next()
        }
    }
}

function errorMessage(code, error, message = '') {
    return {code: code, error: error, message: message}
}

module.exports = Exception
module.exports.errorMessage = errorMessage
