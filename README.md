# yt-dlp-web
![docker latest version](https://img.shields.io/docker/v/sooros5132/yt-dlp-web?color=#4c1) ![docker image size](https://img.shields.io/docker/image-size/sooros5132/yt-dlp-web) ![docker pulls](https://img.shields.io/docker/pulls/sooros5132/yt-dlp-web)
Self-hosted [yt-dlp](https://github.com/yt-dlp/yt-dlp) with the Web UI.<br />
You can watch or download videos downloaded to a remote server.
[Docker Hub](https://hub.docker.com/r/sooros5132/yt-dlp-web) | [Supported Sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)
<br />
# Preview
| Mobile | Desktop | 
|--|--|
| ![DarkMode View](https://github.com/sooros5132/yt-dlp-web/assets/74892930/438d6fb9-18e5-4e89-949f-1b25e072af88) | ![Desktop View](https://github.com/sooros5132/yt-dlp-web/assets/74892930/5bb2d22a-2c93-4428-be02-02e1b65a361d) |
# Getting Started
1. Star this repo ⭐️
2. Create a `docker-compose.yml` file, set `user`, `volumes`, and `ports` to your environment
```YML
version: "3"
services:
  yt-dlp-web:
    image: sooros5132/yt-dlp-web
    container_name: yt-dlp-web
    user: 1000:1000 # User Id, Group Id Setting
    # environment:
    #   If you need to protect the site, set AUTH_SECRET, CREDENTIAL_USERNAME, CREDENTIAL_PASSWORD.
    #   ex)
    #   AUTH_SECRET: "Random_string,_40+_characters_recommended"
    #   CREDENTIAL_USERNAME: "username"
    #   CREDENTIAL_PASSWORD: "password"
    volumes:
      - /path/to/downloads:/downloads # Downloads folder
      - /path/to/cache:/cache         # Cache folder
    ports:
      - 3000:3000 # Web Page Port Mapping
    restart: unless-stopped
```
3. Download and run the Docker image
```BASH
# When docker-compose version is v1
docker-compose up -d
# When docker-compose version is v2
docker compose up -d
```
# Hosted option
If you don’t want to self-host with Docker, [Vid Kraken](https://vidkraken.com) is a managed YouTube download API (info / mp3 / mp4 endpoints).
# Change yt-dlp version
If you change versions, it might not work correctly.
