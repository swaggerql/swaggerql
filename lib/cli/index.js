const program = require('commander')
const pkg = require('../../package.json')
const config = require('config')
const server = require('../server')

function run() {
    program
        .version(pkg.version)
        .option('-i, --input-spec <path>', 'path to specification file',
            process.env.SQAGGER_INPUT_SPEC || config.get('inputSpec'))
        .option('-p, --port <number>', 'http port to start server',
            process.env.SQAGGER_PORT || config.get('port'))
        .option('-d, --client <name>', 'name of client SQL driver',
            process.env.SQAGGER_CLIENT || config.get('client'))
        .option('-c, --connection <dsn|json>', 'connection options to the appropriate database client',
            process.env.SQAGGER_CONNECTION || config.get('connection'))
        .action(async (cmd) => server.run(options(cmd.opts())))
        .parse(process.argv)
}

function options(opts) {
    const options = config.util.cloneDeep(opts)

    if (typeof options.connection === 'string') {
        try {
            options.connection = JSON.parse(options.connection)
        } catch (err) {
            // it's string, do nothing
        }
    }

    return config.util.makeImmutable(config.util.extendDeep(config.util.toObject(), options))
}

module.exports.run = run
