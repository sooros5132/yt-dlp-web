## [yt-dlp](https://github.com/yt-dlp/yt-dlp)를 웹으로 간편하게 사용할 수 있는 프로젝트입니다.

# Preview
| Light | Dark |
|--|--|
| <img width="981" alt="SCR-20230426" src="https://user-images.githubusercontent.com/74892930/234488572-00fcc4f0-f368-4e34-b3d3-2ff0acc03b4a.png"> | <img width="977" alt="SCR-20230427" src="https://user-images.githubusercontent.com/74892930/234488581-8aeddb8b-e1b7-48a4-8a73-70c179ca21d3.png"> |

# 사용법

`docker-compose.yml`에서 `volumes`, `ports`를 환경에 맞게 설정해주세요

## 변경해야 할 부분
```YML
volumes:
  - *your/path*:/downloads
ports:
  - *your-port*:3000
```

## 예시
```YML
volumes:
  - ~/Desktop/downloads:/downloads
ports:
  - 3000:3000
```

## 시작하기
```BASH
# docker-compose v1 일 경우
docker-compose up -d

# docker-compose v2 일 경우
docker compose up -d
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
