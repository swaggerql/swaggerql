ARG BASE_CONTAINER=node:10-slim
FROM ${BASE_CONTAINER}

ARG DRIVER_MODULE
EXPOSE 8000
WORKDIR /app

ENV NODE_ENV="production"
COPY package.json ./
RUN yarn install && \
    yarn add ${DRIVER_MODULE} && \
    yarn cache clean

COPY bin /app/bin
COPY config /app/config
COPY lib /app/lib
COPY openapi.yaml /app/openapi.yaml

ENTRYPOINT ["yarn", "run", "start"]
