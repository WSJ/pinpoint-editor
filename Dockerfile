FROM node:8-alpine

RUN apk add --no-cache tini

EXPOSE 3001

WORKDIR /usr/src/app

# Copy just the package*.json files to perform the install
COPY package* ./
RUN npm install

# Then copy the remaining ones. Splitting the install from the main copy lets us cache the results of the install
# between code changes
COPY . .

# Node wasn't designed to be run as PID 1. Tini is a tiny init wrapper.
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "start"]