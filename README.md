# yt-dlp-web
![docker image size](https://img.shields.io/docker/image-size/sooros5132/yt-dlp-web.svg) ![docker latest version](https://img.shields.io/docker/v/sooros5132/yt-dlp-web.svg)

웹으로 간편하게 [yt-dlp](https://github.com/yt-dlp/yt-dlp)를 이용해보세요.

[Docker Hub](https://hub.docker.com/r/sooros5132/yt-dlp-web) | [Supported Sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)
<br />

# 프리뷰
| Mobile | Desktop | 
|--|--|
| ![DarkMode View](https://github.com/sooros5132/yt-dlp-web/assets/74892930/438d6fb9-18e5-4e89-949f-1b25e072af88) | ![Desktop View](https://github.com/sooros5132/yt-dlp-web/assets/74892930/5bb2d22a-2c93-4428-be02-02e1b65a361d) |

# 설치

`docker-compose.yml`에서 `user`, `volumes`, `ports`를 환경에 맞게 설정해주세요
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
# 시작
```BASH
# docker-compose v1 일 경우
docker-compose up -d

# docker-compose v2 일 경우
docker compose up -d
```

# iOS Shortcut
단축어로 앱의 공유에서 yt-dlp-web을 열 수 있습니다.<br />사용하기 전에 아래 단축어의 설정에서 텍스트 박스에 yt-dlp-web이 배포되어 있는 도메인을 입력해주세요.
[https://www.icloud.com/shortcuts/cde2880ff1cc47b4be37e5b6ce05b155](https://www.icloud.com/shortcuts/cde2880ff1cc47b4be37e5b6ce05b155)

# To Do
- [X] Change to the component library shadcn/ui
- [X] Add the ability to delete selected videos
- [X] Options for Output filename
- [X] Choose quality when downloading immediately
- [ ] ~~Table View~~
- [ ] Code refactoring

# Change Logs
```
Aug 26, 2023 - v0.2.11 - Added option to sync video/audio when cut video

Aug 25, 2023 - v0.2.10 - Optimizing Docker image size (424.69MB -> 134.53MB)

Aug 24, 2023 - v0.2.9
  1. Options for Output filename
  2. Choose quality when downloading immediately
  3. Added Desktop Layout

Aug 23, 2023 - v0.2.8
  1. Change to the component library shadcn/ui
  2. Added the ability to delete selected videos
  3. Added the Original Media URL visible when searched.

Aug 13, 2023 - v0.2.7
  1. Updated to the latest version of yt-dlp.(v2023.07.06)
  2. Added option to set the start or end time of the video when downloading
  3. Deleted the option to embed metadata

Jun 13, 2023 - v0.2.6 - Added Live From Start Option

May 22, 2023 - v0.2.3 - Added Proxy, Embed Subs, Embed Chapters, Embed Metadata Options

May 20, 2023 - v0.2.2 - Added Using Cookies Option

May 15, 2023 - v0.2.0 - Support playlist download

May 11, 2023 - v0.1.5 - Request download in iOS Shortcut

Apr 28, 2023 - Support recording live stream

Apr 23, 2023 - Create Repository
```

<br />

# 테스트한 환경
- Ubuntu 22.4 LTS
- macOS Ventura v13.2.1

# 사용한 기술스택
- [yt-dlp v2023.07.06](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg v6](https://ffmpeg.org/)
- [Next.js v13.3](https://nextjs.org/)
- [React v18.2](https://react.dev/)
- [Typescript v5](https://www.typescriptlang.org/)
- [Docker](https://www.docker.com/)
