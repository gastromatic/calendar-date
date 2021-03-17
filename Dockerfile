ARG NODE_VERSION

###

FROM node:${NODE_VERSION}-alpine

USER node
WORKDIR /home/node

COPY ./package.json ./yarn.lock ./tsconfig.build.json ./tsconfig.json ./
RUN yarn install --frozen-lockfile

COPY /src/ ./src/
COPY /test/ ./test/

ENV NODE_ENV=test
RUN yarn run test:coverage
