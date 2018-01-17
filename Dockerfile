FROM mhart/alpine-node:9

RUN adduser -D -u 1000 terminoid

USER terminoid

WORKDIR /workdir

CMD ["/usr/bin/node", "terminoid.js"]
