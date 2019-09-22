FROM levonet/instantclient-node:18.3-10-slim

EXPOSE 8000
WORKDIR /app

ENV NODE_ENV="production"
COPY package.json ./
RUN yarn install && \
    yarn add oracledb && \
    yarn cache clean

COPY bin /app/bin
COPY config /app/config
COPY lib /app/lib
COPY openapi.yaml /app/openapi.yaml

ENTRYPOINT ["yarn", "run", "start"]
