const expect = require('chai').expect
const sinon = require('sinon')
const QueryBuilder = require('../../lib/query-builder')
const dependencyDb = require('../../lib/query-builder/db')
const Exception = require('../../lib/middleware/exception')

describe('QueryBuilder', () => {
    let dbStub
    let loggerSpy
    let queryBuilder

    beforeEach(() => {
        dbStub = sinon.stub(dependencyDb, 'connect')
            .returns({raw: async () => Promise.resolve([1, 2, 3])})
        loggerSpy = sinon.spy({
            debug: () => {},
            info: () => {},
            log: () => {},
            error: () => {}
        })
        queryBuilder = new QueryBuilder(loggerSpy, {client: '', connection: {}})
    })

    afterEach(() => {
        expect(loggerSpy.log.notCalled)
            .is.true
        dbStub.restore()
    })

    describe('hasWrappedQuery', () => {
        it('false if null', () => {
            expect(queryBuilder.hasWrappedQuery(null))
                .to.be.a('boolean')
                .is.false
        })
        it('false if empty', () => {
            expect(queryBuilder.hasWrappedQuery(''))
                .to.be.a('boolean')
                .is.false
        })
        it('false if a text has not a wrapped a query', () => {
            expect(queryBuilder.hasWrappedQuery('text'))
                .to.be.a('boolean')
                .is.false
        })
        it('false if a text contains only a front wrapper', () => {
            expect(queryBuilder.hasWrappedQuery('\n```sql\n\n'))
                .to.be.a('boolean')
                .is.false
        })
        it('false if a text contains only a rear wrapper', () => {
            expect(queryBuilder.hasWrappedQuery('\n\n```\n'))
                .to.be.a('boolean')
                .is.false
        })
        it('true if a text is a wrapped query', () => {
            expect(queryBuilder.hasWrappedQuery('```sql\nquery\n```'))
                .to.be.a('boolean')
                .is.true
        })
        it('true if a text has a wrapped query', () => {
            expect(queryBuilder.hasWrappedQuery('text\n```sql\nquery\n```\ntext'))
                .to.be.a('boolean')
                .is.true
        })
    })

    describe('wrapQuery', () => {
        it('empty if null', () => {
            expect(queryBuilder.wrapQuery(null))
                .to.be.a('string')
                .equal('')
        })
        it('do nothing if empty', () => {
            expect(queryBuilder.wrapQuery(''))
                .to.be.a('string')
                .equal('')
        })
        it('do nothing if a text contains only a front wrapper', () => {
            expect(queryBuilder.wrapQuery('\n```sql\n\n'))
                .to.be.a('string')
                .equal('\n```sql\n\n')
        })
        it('do nothing if a text contains only a rear wrapper', () => {
            expect(queryBuilder.wrapQuery('\n\n```\n'))
                .to.be.a('string')
                .equal('\n\n```\n')
        })
        it('do nothing if a text is a wrapped query', () => {
            expect(queryBuilder.wrapQuery('```sql\nquery\n```'))
                .to.be.a('string')
                .equal('```sql\nquery\n```')
        })
        it('do nothing if a text has a wrapped query', () => {
            expect(queryBuilder.wrapQuery('text\n```sql\nquery\n```\ntext'))
                .to.be.a('string')
                .equal('text\n```sql\nquery\n```\ntext')
        })
        it('wrap a text', () => {
            expect(queryBuilder.wrapQuery('query'))
                .to.be.a('string')
                .equal('```sql\nquery\n```')
        })
    })

    describe('unwrapQuery', () => {
        it('empty if null', () => {
            expect(queryBuilder.unwrapQuery(null))
                .to.be.a('string')
                .equal('')
            expect(loggerSpy.error.calledOnce)
                .is.true
        })
        it('empty if empty', () => {
            expect(queryBuilder.unwrapQuery(''))
                .to.be.a('string')
                .equal('')
            expect(loggerSpy.error.calledOnce)
                .is.true
        })
        it('empty if a text has not a wrapped a query', () => {
            expect(queryBuilder.unwrapQuery('text'))
                .to.be.a('string')
                .equal('')
            expect(loggerSpy.error.calledOnce)
                .is.true
        })
        it('empty if a text contains only a front wrapper', () => {
            expect(queryBuilder.unwrapQuery('\n```sql\n\n'))
                .to.be.a('string')
                .equal('')
            expect(loggerSpy.error.calledOnce)
                .is.true
        })
        it('empty if a text contains only a rear wrapper', () => {
            expect(queryBuilder.unwrapQuery('\n\n```\n'))
                .to.be.a('string')
                .equal('')
            expect(loggerSpy.error.calledOnce)
                .is.true
        })
        it('query if a text is a wrapped query', () => {
            expect(queryBuilder.unwrapQuery('```sql\nquery\n```'))
                .to.be.a('string')
                .equal('query')
            expect(loggerSpy.error.notCalled)
                .is.true
        })
        it('query if a text has a wrapped query', () => {
            expect(queryBuilder.unwrapQuery('text\n```sql\nquery\n```\ntext'))
                .to.be.a('string')
                .equal('query')
            expect(loggerSpy.error.notCalled)
                .is.true
        })
    })

    describe('handler', () => {
        const ctx = {request: {}}
        const c = {
            request: {},
            operation: {}
        }

        beforeEach(async () => {
            const exception = new Exception(loggerSpy)
            const cb = exception.middleware()
            await cb(ctx, async () => Promise.resolve())
        })

        it('501 if description is empty', async () => {
            await queryBuilder.handler(c, ctx)

            expect(ctx)
                .to.be.an('object')
                .to.deep.include({status: 501, body: {code: 501, error: 'Query is not implemented', message: ''}})
        })
        it('200 if description is not empty', async () => {
            c.operation.description = 'query'
            await queryBuilder.handler(c, ctx)

            expect(ctx)
                .to.be.an('object')
                .to.deep.include({status: 200, body: [1, 2, 3]})
        })
        it('500 if error', async () => {
            c.operation.description = 'query'
            queryBuilder.connection.raw = () => Promise.reject('Error message')
            await queryBuilder.handler(c, ctx)

            expect(ctx)
                .to.be.an('object')
                .to.deep.include({status: 500, body: {code: 500, error: 'Query error', message: 'Error message'}})
        })
    })
})
