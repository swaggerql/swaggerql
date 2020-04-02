const expect = require('chai').expect
const sinon = require('sinon')
const { connect, isConnectionError } = require('../../lib/query-builder/adapter/oracledb')

describe('OracleDB', () => {
    let rawStub
    let loggerSpy
    let connection

    beforeEach(() => {
        rawStub = sinon.stub()
        rawStub.withArgs('broken connection').onCall(0).throws(new Error('ERROR ORA-12537'))
        rawStub.withArgs('broken connection').onCall(1).returns(Promise.resolve([1, 2, 3]))
        rawStub.withArgs('broken query').onCall(0).throws(new Error('ERROR'))
        rawStub.returns(Promise.resolve([1, 2, 3]))

        connect.knex = sinon.stub()
            .returns({
                inspect: () => {},
                raw: rawStub,
                on: () => {}
            })

        loggerSpy = sinon.spy({
            debug: () => {},
            info: () => {},
            log: () => {},
            error: () => {}
        })
        connection = connect(loggerSpy, {client: '', connection: {}})
    })

    afterEach(() => {
        expect(loggerSpy.log.notCalled)
            .is.true
    })

    describe('isConnectionError', () => {
        it('parse without ORA', () => {
            expect(isConnectionError('ERROR'))
                .to.be.a('boolean')
                .is.false
        })
        it('parse with connection ORA', () => {
            expect(isConnectionError('~ORA-03113~'))
                .to.be.a('boolean')
                .is.true
        })
        it('parse with another ORA', () => {
            expect(isConnectionError('~ORA-03115~'))
                .to.be.a('boolean')
                .is.false
        })
    })

    describe('connect', () => {
        it('return connection', () => {
            expect(connection)
                .to.be.an('object')
        })
        it('has ping', () => {
            expect(connection.ping)
                .to.be.an('function')
        })
    })

    describe('newConnection', () => {
        it('return connection', () => {
            expect(connect.newConnection({}))
                .to.be.an('object')
        })
        it('has ping', () => {
            const c = connect.newConnection({})
            expect(c.ping)
                .to.be.an('function')
        })
    })

    describe('retryRaw', () => {
        it('return query result', async () => {
            expect(await connect.retryRaw('select *'))
                .to.be.an('array')
                .to.deep.equal([ 1, 2, 3 ])
            expect(rawStub.calledOnce)
                .is.true
        })
        it('broken connection', async () => {
            expect(await connect.retryRaw('broken connection'))
                .to.be.an('array')
                .to.deep.equal([ 1, 2, 3 ])
            expect(rawStub.calledTwice)
                .is.true
        })
        it('broken query', async () => {
            let result
            try {
                await connect.retryRaw('broken query')
            } catch (error) {
                result = error
            }
            expect(result)
                .to.be.an('error')
            expect(rawStub.calledOnce)
                .is.true
        })
    })

    describe('ping', () => {
        it('return query result', async () => {
            expect(await connection.ping())
                .to.be.an('array')
                .to.deep.equal([ 1, 2, 3 ])
        })
    })
})
