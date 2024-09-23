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

# iOS Shortcut
You can open yt-dlp-web in the app's share with a shortcut.<br/>Before using it, please enter the domain where yt-dlp-web is deployed in the text box in the shortcut's settings below.
[https://www.icloud.com/shortcuts/cde2880ff1cc47b4be37e5b6ce05b155](https://www.icloud.com/shortcuts/cde2880ff1cc47b4be37e5b6ce05b155)

<br />

# To Do
- [X] Change to the component library shadcn/ui
- [X] Add the ability to delete selected videos
- [X] Options for Output filename
- [X] Choose quality when downloading immediately
- [ ] ~~Table View~~ _canceld_

# Tested
- Ubuntu 22.04.2 LTS
- macOS Sonoma v14.1.1

# Used stack
- [yt-dlp v2024.08.06](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg v6](https://ffmpeg.org/)
- [Next.js v13.5](https://nextjs.org/)
- [React v18.2](https://react.dev/)
- [TypeScript v5](https://www.typescriptlang.org/)
- [Docker](https://www.docker.com/)
