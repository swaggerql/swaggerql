const expect = require('chai').expect
const sinon = require('sinon')
const Exception = require('../../lib/middleware/exception')

describe('Exception', () => {
    describe('errorMessage', () => {
        it('with message', async () => {
            expect(Exception.errorMessage(500, 'Error', 'Error message'))
                .to.be.an('object')
                .to.deep.include({code: 500, error: 'Error', message: 'Error message'})
        })

        it('without message', async () => {
            expect(Exception.errorMessage(500, 'Error'))
                .to.be.an('object')
                .to.deep.include({code: 500, error: 'Error', message: ''})
        })
    })

    describe('middleware', async () => {
        const ctx = {}
        let loggerSpy
        let exception

        beforeEach(async () => {
            loggerSpy = sinon.spy({
                debug: () => {},
                info: () => {},
                log: () => {},
                error: () => {}
            })

            exception = new Exception(loggerSpy)

            const cb = exception.middleware()
            await cb(ctx, async () => Promise.resolve())
        })

        afterEach(() => {
            expect(loggerSpy.log.notCalled)
                .is.true
        })

        it('add exception with message', async () => {
            ctx.exception(500, 'Error', 'Error message')
            expect(ctx.status)
                .to.be.a('number')
                .equal(500)
            expect(ctx.body)
                .to.be.an('object')
                .to.deep.include({code: 500, error: 'Error', message: 'Error message'})
            expect(loggerSpy.error.calledOnce)
                .is.true
        })

        it('add exception without message', async () => {
            ctx.exception(500, 'Error')
            expect(ctx.status)
                .to.be.a('number')
                .equal(500)
            expect(ctx.body)
                .to.be.an('object')
                .to.deep.include({code: 500, error: 'Error', message: ''})
            expect(loggerSpy.error.calledOnce)
                .is.true
        })
    })
})
