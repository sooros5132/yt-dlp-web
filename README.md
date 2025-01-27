# yt-dlp-web
![docker latest version](https://img.shields.io/docker/v/cergeyn/yt-dlp-web?color=#4c1) ![docker image size](https://img.shields.io/docker/image-size/cergeyn/yt-dlp-web) ![docker pulls](https://img.shields.io/docker/pulls/cergeyn/yt-dlp-web)

Self-hosted [yt-dlp](https://github.com/yt-dlp/yt-dlp) with the Web UI.<br />
You can watch or download videos downloaded to a remote server.

[Docker Hub](https://hub.docker.com/r/cergeyn/yt-dlp-web) | [Supported Sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)
<br />

# Preview
| Mobile | Desktop | 
|--|--|
| ![DarkMode View](https://github.com/cergeyn/yt-dlp-web/assets/74892930/438d6fb9-18e5-4e89-949f-1b25e072af88) | ![Desktop View](https://github.com/cergeyn/yt-dlp-web/assets/74892930/5bb2d22a-2c93-4428-be02-02e1b65a361d) |

# Getting Started
1. Star this repo ⭐️
2. Create a `docker-compose.yml` file, set `user`, `volumes`, and `ports` to your environment
```YML
version: "3"

services:
  yt-dlp-web:
    image: cergeyn/yt-dlp-web
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

# Change yt-dlp version
If you change versions, it might not work correctly.
```BASH
# To update to nightly from stable executable/binary:
docker exec -u 0 -it yt-dlp-web /usr/local/bin/yt-dlp --update-to nightly

# Specifying versions, releases: https://github.com/yt-dlp/yt-dlp/releases
docker exec -u 0 -it yt-dlp-web /usr/local/bin/yt-dlp --update-to stable@<releases date>
# ex) docker exec -u 0 -it yt-dlp-web /usr/local/bin/yt-dlp --update-to stable@2024.08.06
```

# iOS Shortcut
You can open yt-dlp-web in the app's share with a shortcut.<br/>Before using it, please enter the domain where yt-dlp-web is deployed in the text box in the shortcut's settings below.
[https://www.icloud.com/shortcuts/8b038411c518474bbfe566f9fbe1e046](https://www.icloud.com/shortcuts/8b038411c518474bbfe566f9fbe1e046)

<br />

# To Do
- [X] Change to the component library shadcn/ui
- [X] Add the ability to delete selected videos
- [X] Options for Output filename
- [X] Choose quality when downloading immediately
- [ ] ~~Table View~~ _canceld_

# Tested
- Ubuntu 22.04.2 LTS
- macOS Sequoia v15.0.1

# Used stack
- [yt-dlp v2025.01.15](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg v6.0.1](https://ffmpeg.org/)
- [Next.js v14.2.13](https://nextjs.org/)
- [React v18.2](https://react.dev/)
- [TypeScript v5](https://www.typescriptlang.org/)
- [Docker](https://www.docker.com/)
