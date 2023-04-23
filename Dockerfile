FROM ubuntu:22.04 AS base

ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /downloads
VOLUME /downloads

WORKDIR /app

COPY ./ /app

RUN apt update && \
  # node 16.16.0, npm 8.11.0 install
  apt install -y --no-install-recommends curl wget ca-certificates tzdata && \
  curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
  apt install -y --no-install-recommends nodejs && \
  npm install -g npm n && \
  n 16.16.0 && \
  npm install && \
  # next build
  npm run build && \
  # yt-dlp install
  wget -qO /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp && \
  chmod a+rx /usr/local/bin/yt-dlp && \
  # ffmpeg install
  chmod +x ./src/ffmpeg-install.sh && \
  sh ./src/ffmpeg-install.sh && \
  # clean
  apt clean && \
  rm -rf /var/lib/apt/lists/*

EXPOSE 3000

CMD ["npm", "run", "dev"]
