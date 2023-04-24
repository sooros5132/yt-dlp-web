FROM alpine:edge

WORKDIR /downloads
VOLUME /downloads

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY ./ /app

RUN apk update && \
  apk add nodejs npm ffmpeg yt-dlp

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "start"]
