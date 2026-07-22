ARG NODE_VERSION

###

FROM oven/bun:1 AS bun

FROM node:${NODE_VERSION}-slim

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

USER node
WORKDIR /home/node

COPY ./package.json ./bun.lock ./tsconfig.build.json ./tsconfig.json ./vitest.config.ts ./
RUN bun install --frozen-lockfile

COPY /src/ ./src/
COPY /test/ ./test/

ENV NODE_ENV=test
RUN bun run test:coverage
