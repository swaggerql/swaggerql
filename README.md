# SwaggerQL
[![Build Status](https://travis-ci.org/swaggerql/swaggerql.svg?branch=master)](https://travis-ci.org/swaggerql/swaggerql)
[![Docker swaggerql-mysql](https://img.shields.io/badge/docker-swaggerql--mysql-green)](https://hub.docker.com/r/swaggerql/swaggerql-mysql)
[![Docker swaggerql-mariadb](https://img.shields.io/badge/docker-swaggerql--mariadb-green)](https://hub.docker.com/r/swaggerql/swaggerql-mariadb)
[![Docker swaggerql-postgres](https://img.shields.io/badge/docker-swaggerql--postgres-green)](https://hub.docker.com/r/swaggerql/swaggerql-postgres)
[![Docker swaggerql-oracle](https://img.shields.io/badge/docker-swaggerql--oracle-green)](https://hub.docker.com/r/swaggerql/swaggerql-oracle)
[![Docker swaggerql-sqlite](https://img.shields.io/badge/docker-swaggerql--sqlite-green)](https://hub.docker.com/r/swaggerql/swaggerql-sqlite)

**Swagger** + S**QL** = Simple reference microservice with transparent documentation and no coding.  
All you need to do is create a Swagger file and specify SQL queries in the description.

When you should use it:
- you need an internal microservice with simple queries to an existing database
- you quickly need a prototype of a reference service
- you need to test data in the database
- you need a stub application with database access to test the deployment scripts

![Screenshot](https://raw.githubusercontent.com/swaggerql/swaggerql/master/screenshot.png)

## Getting Started

Install the appropriate database module before using the SwaggerQL:
- `pg` for PostgreSQL and Amazon Redshift
- `mysql2` for MySQL
- `mysql` for MariaDB or MySQL
- `sqlite3` for SQLite3
- `mssql` for MSSQL
- `oracledb` and [Oracle instant-client](https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html) for Oracle

<details open>
<summary><strong>Run SwaggerQL with PostgreSQL</strong></summary>

```sh
npm install swaggerql
npm install pg
```

Create `config/local.yaml`

```yaml
client: pg
connection:
  host: 127.0.0.1
  user: your_database_user
  password: your_database_password
  database: myapp_test
```

Run SwaggerQL

```sh
$(npm bin)/swaggerql
```

And try [http://0.0.0.0:8000](http://0.0.0.0:8000)
</details>

<details>
<summary><strong>Run SwaggerQL with Oracle</strong></summary>

```sh
npm install swaggerql
npm install oracledb
```
Install [Oracle instant-client](https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html)

Create `config/local.yaml`

```yaml
client: oracledb
connection:
  user: your_database_user
  password: your_database_password
  connectString: (DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=127.0.0.1)(PORT=1521)))(CONNECT_DATA=(SID=MY_SID)))
pool:
  min: 0
  max: 3
```

Run SwaggerQL

```sh
$(npm bin)/swaggerql
```

And try [http://0.0.0.0:8000](http://0.0.0.0:8000)
</details>

More examples in [the repository](https://github.com/swaggerql/swaggerql/tree/master/examples).

## Configuration

### Connect to DB

The [knex](https://github.com/tgriesser/knex) library is used to connect to various databases.
The most common configuration file format is:

```yaml
client: <driver>
connection:
  host: 127.0.0.1
  user: your_database_user
  password: your_database_password
  database: myapp_test
```

More examples of connection configurations in [Knex documentation](http://knexjs.org/#Installation-client)

See [node-config](https://github.com/lorenwest/node-config/wiki/Configuration-Files) documentation for information about naming,
load order and format of configuration files.

### REST API

Build APIs by describing them in [OpenAPI document specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md)
and importing them via YAML or JSON to construct your own REST API.

The only difference is that a SQL query is inserted into the description field.

```yaml
paths:
  /two:
    get:
      summary: One plus one equals two
      description: |
        SELECT 1+1
      responses:
        200:
          description: OK
```

## CLI

Configuration options can be overridden via command-line arguments or environment variables.
Priorities are the following:
- A command-line option has the highest priority. It overrides the environment variable and config file value.
- An environment variable has second priority. It overrides the config file value.
- A config file value has the lowest priority.
- If there isn't a command-line option, environment variable or config file option specified, the default is used.

Run `$(npm bin)/swaggerql --help` for more information.

```
Usage: swaggerql [options]

Options:
  -V, --version                output the version number
  -i, --input-spec <path>      path to specification file (default: "openapi.yaml")
  -p, --port <number>          http port to start server (default: 8000)
  -d, --client <name>          name of client SQL driver
  -c, --connection <dsn|json>  connection options to the appropriate database client
  -l, --log-level <level>      logging level: debug, info, warn, error (default: "info")
  -h, --help                   output usage information
```

Environment variables:
- `SWAGGERQL_INPUT_SPEC` — path to specification file
- `SWAGGERQL_PORT` — http port to start server
- `SWAGGERQL_CLIENT` — name of client SQL driver
- `SWAGGERQL_CONNECTION` — connection options to the appropriate database client
- `SWAGGERQL_LOG_LEVEL` — logging level

## Docker

```sh
docker run -it --rm -p 8000:8000 \
        -v $(pwd)/config/local.yaml:/app/config/production.yaml \
        -v $(pwd)/openapi.yaml:/app/openapi.yaml \
        swaggerql/swaggerql-mysql
```

Available Docker containers:
- [swaggerql/swaggerql-mysql](https://hub.docker.com/r/swaggerql/swaggerql-mysql)
- [swaggerql/swaggerql-mariadb](https://hub.docker.com/r/swaggerql/swaggerql-mariadb)
- [swaggerql/swaggerql-postgres](https://hub.docker.com/r/swaggerql/swaggerql-postgres)
- [swaggerql/swaggerql-oracle](https://hub.docker.com/r/swaggerql/swaggerql-oracle)
- [swaggerql/swaggerql-sqlite](https://hub.docker.com/r/swaggerql/swaggerql-sqlite)
