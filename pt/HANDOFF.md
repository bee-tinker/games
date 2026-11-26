# 짐코치 인수인계 (2026-11-26, 테스트 버전 0.1.5 기준)

다음 작업 세션이 이 문서만 읽고 바로 이어갈 수 있게 정리한 내용이다.

## 1. 무엇을 만들고 있나

- **짐코치**: 헬스 초보자가 아파트·동네 헬스장에서 폰 하나로 PT를 받는 것처럼 쓰는 **완전 무료 웹앱(PWA)**.
- 운동과 회복에만 집중한다. 식단·커뮤니티·배지·로그인은 넣지 않는다.
- 데이터는 폰 브라우저 저장소(localStorage)에만 저장한다. 서버 없음, 비용 0원.
- 광고는 화면 맨 아래 한 줄 자리만 있고 아직 실제 광고는 붙이지 않았다. 운동 중·휴식 중에는 숨긴다.

## 2. 주소

| 무엇 | 주소 |
|---|---|
| 배포된 앱 | https://bee-tinker.github.io/games/pt/app/ |
| 앱 코드 | `pt/app/` (`index.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`) |
| 기획 단계 시안 | `pt/mockup.html` (참고용, 이제 수정하지 않음) |
| 기획서 (Claude 문서) | https://claude.ai/artifact/6iUAK4fjUx62qcWAXDCLcz |
| 확인용 미리보기 (Claude 페이지) | https://claude.ai/artifact/LawZNJvogPTqRde5nzxWb7 |
| 저장소 | `bee-tinker/games` (공개), GitHub Pages는 `main` 브랜치 루트에서 배포 |

## 3. 배포하는 방법

1. `pt/app/index.html`을 고친다.
2. **버전 올리기 (두 곳 모두):**
   - `pt/app/sw.js`의 `var CACHE='gymcoach-v0.1.5';` → 다음 번호
   - `pt/app/index.html`의 `짐코치 테스트 버전 0.1.5` 문구 → 같은 번호
3. 작업 브랜치에 커밋·푸시 → `main`으로 PR을 만들고 합친다(사용자가 배포까지 맡겨둠).
4. Pages가 약 45초 뒤 배포한다. `curl -s https://bee-tinker.github.io/games/pt/app/sw.js | grep gymcoach-v` 로 새 버전을 확인한다.
5. 미리보기 페이지도 갱신하려면: `index.html`에서 `<title>`~`</style>`과 `<body>` 안쪽(서비스 워커 등록 스크립트 제외)을 떼어 `<meta name="claude:viewport-fit-sides" content="cover">`를 붙인 파일을 만들어 Artifact로 다시 올린다(같은 URL 유지하려면 같은 파일 경로 또는 `url` 지정).

- 서비스 워커(`sw.js`)는 **화면(HTML)은 인터넷 우선**, 나머지는 저장본 우선이다. 새 버전이 깔리면 페이지가 자동 새로고침하되, 운동·휴식 중(`window.__gcBusy`)에는 기다린다.
- 작업 환경: github.io에 접속하려고 **"games"** 클라우드 환경(허용 호스트 `bee-tinker.github.io`)을 만들어 두었다. 새 세션도 이 환경에서 열면 배포 주소를 직접 확인할 수 있다.

## 4. 테스트하는 방법

- 로컬: `cd pt/app && python3 -m http.server 8765` 후 Playwright(사전 설치됨, `require('playwright')`)로 390×780 화면에서 눌러본다.
- 시간 관련 확인은 `page.clock.install()` → `page.clock.fastForward('00:30')`.
- 배포 주소 확인 시 Playwright는 `chromium.launch({proxy:{server:process.env.HTTPS_PROXY}})`, 컨텍스트에 `ignoreHTTPSErrors:true`.
- 매번 확인하는 것: 스크립트 오류 없음, `document.documentElement.scrollHeight`가 화면 높이(780)를 넘지 않음(장면마다 스크롤 없이).
- 그림(장면) 확인: 테스트 사본에서 `sceneSvg`를 `window`에 노출해 시작(0)·끝(1) 자세를 한 장에 모아 본다.

## 5. `pt/app/index.html` 구조 (한 파일, 약 140KB)

스크립트 안 주요 구역(`// =====` 주석으로 구분):

| 구역 | 내용 |
|---|---|
| 기구 목록 `GEAR` | 21개 기구(하체 5, 가슴 3, 등 3, 어깨·팔 2, 유산소 3, 기타 5) |
| 운동 사전 `LIB` | 28개 운동: 부위, 회복 그룹, 기구, 무게 단계, 목표 횟수, 조심 부위(`cau`), 7주차 이후(`lvl:2`) |
| `MUS`, `EXTRA_CAU`, `TIPS` | 운동별 쓰는 근육, 기타 입력용 조심 부위, 주의사항 4개씩 |
| 자동 추천 `TPL`, `FREQK`, `generate()` | 날 종류(A·B·U·L·P·PL·LG·R)별 칸과 후보, 주 1~7회 나누기, 조심 운동 남기기 |
| 저장 데이터 `D` | `gymcoach-v1` 키. `settings, exp, gearOn, prog, memos, history, weights, nextDay` |
| 회복 `computeRec()` | 세트당 피로(주 1, 보조 0.5, 힘듦 1.5배, 쉬움 0.7배), 72/48시간 감소, ×12.5 |
| 무게 `startW/baseW`, `plan()` | 처음 60%, 컨디션 강도, 적응 기간 2세트, 조심 운동 20% 가볍게 |
| 인체도 `bodyArt()` | 이어진 몸 윤곽 + 근육 영역(회복 색 또는 쓰는 근육 빨간색) |
| 기구 그림 `MACH` | 기구만 그린 옆모습(목록 썸네일용) |
| 장면 `SCN`, `FSCN`, `person()`, `frontPerson()` | 기구+사람 움직이는 그림. 옆모습은 IK로 팔다리 계산, 정면(이너 타이·랫풀다운·펙덱·리어 델트·스미스)은 따로 |
| 화면 `vOnb, vHome, vCheck, vPreview, vWork, vRest, vDone, vRecords, vMe, vProg, vGear` | 장면별 화면 |
| 완료 `finishSession()` | 기록 저장 + 다음 무게 계산(더블 프로그레션, 2번 실패 시 −10%) |
| 렌더·이벤트 | `render()`(같은 화면이면 `.scroll` 위치 유지), `data-act` 클릭 처리, 타이머 |

## 6. 사용자가 정한 것 (바꾸지 말 것)

- 한국어, 쉬운 말. 기구 이름은 **기구에 적힌 원래 이름**(레그프레스 등). 쉬운 한글 풀이 이름은 쓰지 않기로 함.
- 그림은 **사진 대신 직접 그린 그림**. 막대 인형 같은 단순 그림이나 동그라미 모음 같은 근육은 싫어함. 기구 안내판 스타일(회색 제목 띠 + 검은 바탕 + 앞뒤 인체도 + 쓰는 근육 빨간색) 선호.
- 화면은 **장면별로 나눠 스크롤 없이** 한 화면에.
- 비용 0원: 앱스토어·도메인·유료 API 쓰지 않음.
- 다른 사용자도 쓸 수 있게 특정 아파트 이름은 앱에 넣지 않음. 기구는 첫 설정에서 헬스장 종류 선택 + 토글.
- 운동 중 화면: 위 가운데 **세트당 남은 시간 원 타이머**(1회 4초 + 15초), 양옆 지금 세트·남은 세트, 가운데 안내판 카드는 크게.

## 7. 다음 할 일

- [ ] 사용자가 헬스장에서 써보며 모은 불편한 점 반영
- [ ] 랫풀다운과 어시스트 친업 기구 나누기 (지금은 `lat_pd` 하나에 묶여 있어 친업 기계가 없어도 추천될 수 있음)
- [ ] 쉬는 날 스트레칭·폼롤러 안내
- [ ] 안내판 글자 인식(2차, 폰 안 OCR로 기구 이름 자동 선택)
- [ ] 회복·무게 기본값을 실제 사용 후 조정
- [ ] 광고 서비스 선택 (github.io 주소로 승인되는지 확인 필요)

## 8. 알려진 한계

- 그림은 단순화된 그림이라 실제 기계(FITNESS K, OXIZEN 등)와 모양이 똑같지 않다.
- 사이드 레이즈는 옆모습이라 앞으로 드는 것처럼 보인다.
- 음성 안내는 폰의 한국어 음성이 있어야 들린다(테스트 브라우저에서는 소리 확인 불가).
- Claude 미리보기 페이지에서는 백업 파일 저장이 막혀 있다(배포 주소에서는 동작).
