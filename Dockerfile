FROM alpine:edge

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY ./ /app

RUN apk update && \
  apk add nodejs npm ffmpeg yt-dlp && \
  npm install && npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
