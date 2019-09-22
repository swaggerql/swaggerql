# SQagger

SQL + Swagger = Simple Reference Microservice for internal use

## Dependencies

- [Oracle instant-client](https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html) for `oracledb`.

## Docker

```sh
# Build
docker build -t sqagger-oracledb:latest .

# Run
docker run -it --rm -p 8000:8000 -v $(pwd)/config/local.yaml:/app/config/production.yaml sqagger-oracledb:latest
```
