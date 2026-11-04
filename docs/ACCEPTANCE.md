# Issue #1 acceptance record

## Tower / star / goods core, 2026-11-05

The latest user instruction replaces the stamp-only core. Confirm an ordinary life promise, explicitly place one stone per KST day, reveal one personal star, complete each 100-stone tower and unlock a goods draw. The second tower begins at 101, the third at 201, and the yearly goal completes at 300. A life-promise category also grants one ticket at its first 100 distinct recorded dates; the selected meal promise and an evening meal check on the same date count only once.

`?demo=1` or admin mode enables actual keyboard `1` repetitions and a mobile add button. Demo stones, category counts and prize records persist separately from real dates, stones and prizes. Demo is capped at 300. Resetting demo never clears real records. Spectators cannot add stones or draw. Old v1/v2 records migrate into v3 without invented retroactive stones.

Three InstancedMesh cairns animate the latest stone falling into place. Personal Points/LineSegments reveal one star per stone; the separate constellation viewer and PNG cards use the same deterministic positions. Cards include three actual tower counts, stars, and explicit simulation labels when needed.

The user explicitly requested the supplied HTML's goods to appear on screen. Only the 20 authorized product-design tiles were extracted into `assets/goods/`; the private HTML and other source references remain excluded. Each eligible source ticket can draw once, with a locally randomized goods ID and saved result. The user confirmed no fulfillment system exists and selected implementation before shipping integration. All results therefore say fulfillment pending, demo results never claim real entitlement, the shipping button is disabled, and no address/contact data are collected. Real fulfillment needs server-verified eligibility, an operations inventory and a separate consented claim flow.

Validation: 19 state/asset tests pass, including real 100/101/300 boundaries, once-per-day placement, category-date deduplication, reward replay rejection, migration, demo cap/reset/isolation and spectator protection. `npm run qa` performs 300 real keyboard events in a browser, renders all three towers, opens the 20-product gallery, draws a real local image/result, checks persistence, inspects 300 stars, generates a PNG and exercises mobile and Canvas fallback. Browser errors: zero. Latest software-GPU low-tier capture at 300 stones: 42 calls, 37,530 triangles, eight point lights; physical-device FPS remains unverified.

These entries supersede earlier stamp-only / evening-core acceptance descriptions below. No server-wide presence, real shipment, production eligibility security or retention effectiveness is claimed.

## Revision following user feedback, 2026-11-05

The daily core now works at any KST hour: choose an ordinary care action, perform it outside the app, confirm it, earn one daily stamp, and revisit a dated album / seven-stamp postcard. Completion is self-reported, not monitored or verified. Evening checks remain optional. v2 storage migrates v1 dates/promises/stars and keeps the old key intact so an already-open old tab cannot erase new care records.

Player height is approximately 2.16 world units, with NPCs scaled consistently against doors/furniture. Overlapping left status copy is hidden. Campfire interaction and the 100 log-seat layout are removed; their legacy GLBs are no longer loaded. The hub has a seven-stamp record stand and home lights respond to care completion.

Instagram-oriented sharing sends one real PNG at a time (1080x1920 or 1080x1080) into native Web Share, with explicit OS target selection and final posting in Instagram. Unsupported browsers get save/caption/app-link instructions; cancellation never claims success. The website cannot force a share target or verify Instagram posting, per https://www.w3.org/TR/web-share/ . There is no Instagram publishing API integration or automatic account posting.

13 automated state/asset tests pass. `scripts/improvements-qa.js` checks the new loop, reload, album, actual PNG dimensions, single-file handoff, cancellation/unsupported paths, mobile and fallback. Native share is mocked for payload assertions; real Instagram posting is **not** claimed verified. These updates supersede the earlier core/scene descriptions below. Retention and brand fit still require user testing; collecting stamps is not evidence of proven daily retention.

The user-provided v1.0 brief and PC/NPC references were read locally. They remain outside this public repository. `AGENTS.md` is unchanged. The submitted GLBs are independently authored geometric models, with animated mesh nodes. They do not embed source images or constitute approved production character likeness.

## Implemented

- Browser-playable 3D world, original five hub/spoke coordinates, camera/movement/joystick/E/click, optional promise/completion/greeting/scripted Promy conversation.
- Three one-tap daily checks, KST opening hours and midnight, one cumulative day per date, versioned allowlisted localStorage, reload recovery, cumulative days/streak, one grace day per Monday-based KST week. A missed Sunday consumes the prior week's coupon. No arbitrary names or promise prose persist.
- Assigned home with separate table/porch/window response, home star; 7/30/100/365-day visual unlocks; 100-day scene and local honor sign. Admin previews do not fabricate saved dates.
- KST phases and 21:00 ritual, admin time/demo controls, spectator camera, explicitly simulated neighbors, replaceable presence interface.
- 27 Draco GLBs, shared 256px palette, flat normals, independent animation clips and separate postmaster accessories. Reproducible Node asset source; Blender was unavailable.
- Instanced vegetation/lanterns/100 seats, merged scenery, 1024 shadows, eight point lights, desktop bloom and adaptive low tier. Single Points geometry supports 100k stars, 25k on initial low tier.
- Avatar PNG capture, portrait/square cards, native file sharing when supported and downloads otherwise; generation and share clicks measured separately. Referral allowlist, six preapproved camp names, local widget.
- Previous-day card and three prior-week cards plus human-approval JSON queue. All data are explicitly local; no service-wide statistics or posting claims.
- Manual 30-second portrait WebM: 3D scene-to-sky camera tilt on WebGL, a Canvas alternative on fallback, AI watermark and demo label. Supported MediaRecorder browser required.
- Same-state 2D Canvas fallback, bundled engine/decoder, versioned service-worker offline core, actual-browser 20-second MP4 backup with AI/demo watermark. Video loads only on request.
- Korean world/UI copy in `src/data/copy.ko.json`, separate seasonal/demo/brand/reward data. Original strategy and historical 2D prototype retained.

## Evidence

`npm test`: 10 tests cover KST midnight, opening windows, repeat clicks, persistence, weekly coupon boundaries, unavailable/corrupt storage, spectator protection, 100 days and decoding all compressed assets against budgets.

`npm run qa`: desktop/mobile emulation; check-in/promise/star/reload; 21:00 and 100-day previews; portrait PNG; 2D continuation; forced WebGL failure; joystick movement; spectator controls. Console errors are asserted absent. Reports/screenshots go to ignored `test-results/`.

`node scripts/extended-qa.js`: live KST midnight without reload, offline reload, six isolated concurrent 3D browser contexts. This verifies independent entry and interactions, not shared presence.

`node scripts/export-qa.js`: actual 30-second WebM, four editorial PNGs and approval JSON. The test video's final packet is approximately 29.97 seconds. Bundled backup MP4 is exactly 20 seconds.

Final software-GPU run: 1,963,088 initial uncompressed response bytes; desktop with bloom 59 draw calls / 35,848 triangles / eight point lights during ritual. Adaptive low tier also passed in earlier runs. These are instrumentation results, not physical Android FPS certification. Full quality still needs profiling on PT hardware.

## Remaining acceptance checks

- Physical 2022 Android/lower-tier phone FPS, iOS native share, actual six phones on the venue network, QR URL and offline rehearsal. Emulation cannot certify these.
- Model likeness/art polish and brand/IP approval. The uploaded references are not ready-made 3D rigs.
- The brief requests six phones' houses to appear live on the presentation screen while choosing localStorage for v1. This build implements local records and explicit simulation. Real shared houses/attendance need a backend and network verification.
- External reward/entry/donation operations, service-wide counters, automatic server rendering/posting and source/character publication rights remain outside this local demo. External rewards are not promised or collected.

Keep Issue #1 open pending these checks. The brief's automatic legal-exemption claims were not adopted; production review remains required by `AGENTS.md`.


## 후속 수정: 독립 생일 별자리 / 상태 보존

- v4 저장: 월·일만 허용, 12궁 날짜 경계와 2월 29일 처리. 돌탑 수에서 개인 별을 생성하던 결합 제거.
- 실제 방문은 탭 세션당 1회. 새로고침·모달 왕복은 추가하지 않음. 시연 키2 및 모바일 방문 +1은 별도 저장, 뽑기권 없음.
- 100회 미만 기념 카드 잠금, 100회 이상 최신 100회 단위 카드와 날짜/잔여일/메시지. PNG 9:16 및 1:1. 기본 로컬 메시지이며 AI 미연결 표시.
- 생일 입력 즉시 도식은 볼 수 있으며 기념 카드만 100회부터 열림. 정확한 별의 천구 좌표나 점성술 서비스가 아님.
- legacy 모달을 body로 이동하고 모든 모달이 열리면 월드 레이블 숨김. 카메라 입력·이동 정지, 닫으면 같은 시점 유지. sessionStorage에 시점과 위치 복원.
- 실제 배송은 미연결. 사용자 배송 시스템 없음 확인을 유지함.

검증: 단위 테스트 22개 통과. 기존 300돌 브라우저 QA 통과(모바일·2D 포함). birthday-qa 및 birthday-view-qa 통과: 실제 키2 100/200회, 무보상, 생일 변경/복원, 카드 PNG, 모달 레이어, 선물 보관, 새로고침 방문 중복 방지, 모달 내 카메라 정지/재접속 시점 복원, 모바일 2월 29일 및 방문 버튼. 브라우저 오류 0건.


## 시연 초기화 및 음악

사용자 요청으로 0/Numpad0은 demo 돌탑·카테고리 진행·당첨 기록을 초기화하고 별 방문은 보존합니다. 9/Numpad9는 demo 방문 횟수·기념 카드를 초기화하고 생일·돌탑을 보존합니다. 실제/관람 모드에서는 이 초기화가 차단됩니다. 기존 전체 시연 초기화 버튼도 유지합니다.

사용자가 제공한 「지금 그대로 (1).mp3」 약55.032초를 40% 음량의 HTMLAudio loop로 연결했습니다. 사용자 재생 버튼 클릭으로 시작하고 모달 왕복 중에도 재생을 유지합니다. 로컬 및 오프라인 캐시에 포함합니다.

검증: 테스트23개 및 reset-music-qa 통과. 실제 키0/9와 새로고침 복원, 생일 유지, 별찾기 기념 카드 잠금 복귀, 뽑기권0, MP3 재생·곡 끝 loop wrap·일시정지/재개 및 2D를 검증했습니다. 열려 있던 IAB 시연에서도 돌탑0/방문0으로 초기화하고 음악 재생 상태를 확인했습니다. 기존 탭은 구버전 코드로 열려 있어 새로고침으로 최신 버전을 적용했습니다.


## 최신 후속 요구: 성장형 별자리 / 함께 보는 하늘 / 저전력

이 절이 과거 즉시 완성 미리보기 및 화면상 초기화 버튼 설명을 대체합니다. 0~99회에는 미완성,100회에 완성하며366번째 방문에는0으로 돌아갑니다. 실제·시연 모두 적용, 생일·돌탑 및 방문 세션 중복 방지는 유지합니다. 화면에서 시연키/초기화/모드전환 조작 안내를 제거했습니다.

하늘 보기와 이전 시점 복원, 내 별+시뮬레이션 이웃 별자리, 숨은8키로1/1~12/31의365일 추가,7키는이웃만 초기화. 전체365개를2개geometry로 묶고 변경시에만 재생성합니다. 실시간 다른 사용자 데이터로 표시하지 않습니다. 100돌 완성시높이2.142와 프로미/약속 배지,2D에서도완성축소를적용합니다.

기본 저전력·15fps대기/30fps이동/2fps모달·숨은탭RAF중지·그림자/후처리끄기·기본4조명·저해상도픽셀비율·상태/지오메트리변경시캐시·10Hz레이블. 이전 저사양300돌 측정37530삼각형과 달리 이번100돌+365이웃조건은21096삼각형/43drawcalls/15fps상한으로 측정(장면조건이 다르므로 동일조건속도비교는아님). 실기팬소음/전력측정은하지않았습니다.

검증: 단위25개, sky-performance-qa 통과. 0회빈별/99미완성/100카드,365→0저장복원,365일생일생성,8/7키,기술안내제거,프로미이미지로딩,캐릭터이하돌탑,저전력상한/조명/드로콜,모바일크기2D하늘뷰. 브라우저오류0건.
