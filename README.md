# yt-dlp-web
웹으로 간편하게 [yt-dlp](https://github.com/yt-dlp/yt-dlp)를 이용해보세요.

[Supported Sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

<br />

# 프리뷰
| Light | Dark |
|--|--|
| <img width="981" alt="SCR-20230426" src="https://user-images.githubusercontent.com/74892930/234488572-00fcc4f0-f368-4e34-b3d3-2ff0acc03b4a.png"> | <img width="977" alt="SCR-20230427" src="https://user-images.githubusercontent.com/74892930/234488581-8aeddb8b-e1b7-48a4-8a73-70c179ca21d3.png"> |

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
      - 3000:3000 # Port mapping
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

# Change Logs
```
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
- [yt-dlp v2023.03.04](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg v6](https://ffmpeg.org/)
- [Next.js v13.3](https://nextjs.org/)
- [React v18.2](https://react.dev/)
- [Typescript v5](https://www.typescriptlang.org/)
- [Docker](https://www.docker.com/)
