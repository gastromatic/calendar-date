ARG NODE_VERSION

###

FROM node:lts-alpine as build

USER node
WORKDIR /home/node

COPY ./package.json ./yarn.lock ./tsconfig.build.json ./tsconfig.json ./
RUN yarn install --frozen-lockfile

COPY src/ ./src/

RUN yarn build

###

FROM node:${NODE_VERSION}-alpine

USER node
WORKDIR /home/node

COPY ./package.json ./tsconfig.build.json ./tsconfig.json ./
COPY ./test/ ./test/

COPY --from=build /home/node/node_modules/ ./node_modules/
COPY --from=build /home/node/dist/ ./src/

ENV NODE_ENV=test
RUN yarn run test:coverage
