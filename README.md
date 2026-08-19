# 찍스티커 (ZzikSticker)

사진을 찍으면 AI가 배경을 지워서 스티커(마그넷)로 만들어주고, 냉장고/화이트보드/현관문/파티션 같은 화면에 붙이거나, 가챠 머신처럼 물리 효과로 쏟아서 모을 수 있는 PWA입니다.

서버나 백엔드 없이 순수 HTML/CSS/JS로만 동작하는 클라이언트 전용 앱이며, 저장은 브라우저의 IndexedDB를 사용합니다.

## 폴더 구성

- `index.html` — 앱의 기본 뼈대
- `app.js` — 전체 로직 (카메라, 배경 제거, 스티커 저장/배치, 가챠 물리, 사운드 등)
- `style.css` — 전체 스타일
- `service-worker.js` — PWA 오프라인 캐시
- `manifest.json` — PWA 설치 매니페스트
- `icons/` — 앱 아이콘

## 테스트/배포 방법

지금은 별도 빌드 과정이 없습니다. `index.html`을 정적 파일 호스팅(Netlify Drop 등)에 올리면 바로 동작합니다.

배포한 뒤 화면 상단의 빌드 배지(`build-YYYY-MM-DD-NN` 형식, `app.js` 상단의 `BUILD_ID`)로 최신 버전이 반영됐는지 확인할 수 있습니다.

## 함께 작업하기

이 저장소를 각자 로컬에 내려받아 수정한 뒤, GitHub Desktop이나 `git push`로 반영해주세요. 코드를 수정한 뒤에는 `app.js`의 `BUILD_ID`와 `service-worker.js`의 캐시 버전(`SHELL_CACHE`/`RUNTIME_CACHE`)을 함께 올려주시면, 배포 후 실제로 새 버전이 적용됐는지 배지로 바로 확인할 수 있습니다.
