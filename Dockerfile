FROM node:20-alpine

WORKDIR /app

# Install bash just in case we need it for entrypoint
RUN apk add --no-cache bash

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npx tsc

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]