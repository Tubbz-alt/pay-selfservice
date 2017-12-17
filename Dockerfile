FROM node:6.12.2-alpine

# This section is to fix some security vulnerabilities present in our baselayer.
# Here, we update the vulnerable packages pulling them from the Alpine edge branch.
# This is just a short-term patch.
RUN set -x \
        && apk add --no-cache \
                musl="1.1.18-r2" \
                musl-dev="1.1.18-r2" \
                libc6-compat="1.1.18-r2" \
                openssl="1.0.2n-r0" \
                c-ares="1.13.0-r0" \
                busybox="1.27.2-r7" \
                bash="4.4.12-r5" \
           --repository http://dl-cdn.alpinelinux.org/alpine/edge/main


RUN apk update &&\
    apk upgrade &&\
    apk add --update bash libc6-compat

ADD package.json /tmp/package.json
RUN cd /tmp && npm install --production

ENV PORT 9000
EXPOSE 9000

WORKDIR /app
ADD . /app
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
RUN ln -s /tmp/node_modules /app/node_modules

CMD npm start
