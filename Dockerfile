ARG BASE_CONTAINER=node:10-slim
FROM ${BASE_CONTAINER}

ARG DRIVER_MODULE
ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV:-production}
EXPOSE 8000
WORKDIR /app

COPY package.json ./
RUN yarn install && \
    yarn add ${DRIVER_MODULE} && \
    yarn cache clean

COPY bin /app/bin
COPY config/default.json /app/config/default.json
COPY lib /app/lib
COPY openapi.yaml /app/openapi.yaml

ENTRYPOINT ["yarn", "run", "start"]
