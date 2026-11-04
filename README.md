# 약속 우체국 · DB-PROMY

Issue #1, AGENTS.md와 사용자가 제공한 v1.0 브리프를 기준으로 개발한 3D 체험 데모입니다. **오늘의 그대로** 체크인이 코어이며 약속 → 등불 → 별은 선택형 행동입니다.

## 실행

Node.js 22 이상에서 `npm ci`, `npm run serve`를 실행하고 [로컬 동네](http://127.0.0.1:4173/world.html)를 엽니다. GLB와 모듈 로딩을 위해 HTTP 서버를 사용하세요. 상대 경로를 사용하므로 GitHub Pages 하위 경로에서도 작동합니다.

| 주소 | 용도 |
|---|---|
| world.html | KST 실시간 3D 동네 |
| world.html?admin=1 | 시각·시뮬 이웃·21시·100일·카드·영상 시연 |
| world.html?spectate=1 | 관람 카메라, 참여 버튼 비활성 |
| world.html?quality=low | 저사양 모드 |
| fallback.html | 같은 localStorage를 쓰는 2D Canvas 동네 |
| backup.html | 실제 브라우저에서 녹화한 20초 MP4 백업 |
| widget.html | 로컬 등불·시뮬레이션 이웃 위젯 |
| index.html / world-2d.html | 기존 제안서 / 이전 프로토타입 |

`?src=reels|story|blog|qr-camp|qr-concert|kakao`는 로컬 유입 카운터입니다. `?name=`은 정해진 캠프 네임 6개만 허용합니다. 자유 입력·약속 원문·연락처는 받지 않습니다.

핵심 행동은 어느 시간에나 시작할 수 있는 **작은 돌봄 약속 → 실천 확인 → 하루 한 장의 우표 → 7장의 안부 엽서**입니다. 지난 기록을 다시 보고 실제 기록 날짜가 담긴 PNG를 공유할 수 있습니다. 기존 저녁 체크인은 펼쳐서 사용하는 선택 행동이며 17시, 귀가는 18시부터 열립니다. 하루 여러 행동을 해도 누적일은 한 번만 늘어납니다. 주간 쿠폰은 연속일만 보완합니다. 저장 스키마 v2는 v1 기록을 보존해 이전합니다.

Instagram 버튼은 스토리/피드 규격 PNG 한 장을 기기 공유창으로 전달합니다. 사용자가 Instagram을 선택하고 게시를 마칩니다. 웹에서 Instagram을 강제 선택하거나 게시 성공을 확인하지 않습니다. 직접 전달을 지원하지 않는 기기는 PNG 저장·문구 복사·Instagram 열기로 이어집니다. `node scripts/improvements-qa.js`가 이미지 크기, 한 장 전달, 취소/미지원, 기록 복원, 모바일/2D 루프를 검증합니다. 실제 Instagram 앱 게시 확인은 실기 테스트가 필요합니다.

PC는 크림색 몸·주황 컬, NPC는 노란 비대칭 머리·초록 스카프/망토의 별도 GLB입니다. 제작 소스는 scripts/build-assets.js, 압축 후 크기·삼각형·클립 목록은 assets/glb/manifest.json에 있습니다. 원본 브리프·캐릭터 이미지·NPC HTML은 공개 저장소에 포함하지 않았습니다.

## 검증과 재생성

`npm test`로 상태/에셋 테스트를 실행합니다. `npm run qa`, `node scripts/extended-qa.js`, `node scripts/export-qa.js`는 다른 터미널에서 서버가 실행 중이어야 합니다. QA 브라우저가 없으면 `npx playwright install chromium`을 실행하세요. PLAYWRIGHT_BROWSERS_PATH를 지정한다면 설치와 실행에 같은 경로를 사용합니다.

모델·벤더·카피를 변경한 뒤 `npm run vendor`, `npm run assets`, `npm run offline`으로 생성물을 갱신합니다. 첫 온라인 방문에서 코어 오프라인 캐시를 준비합니다. MP4는 초기 다운로드에 포함하지 않으므로 발표 전에 백업 파일을 별도로 준비하세요.

상세 구현 범위·측정 결과·남은 실기/아트 검증은 [수용 기준 기록](./docs/ACCEPTANCE.md)에 정리했습니다. 격리된 브라우저 6개 검증은 실물 휴대폰 검증이나 실시간 동기화를 의미하지 않습니다.

**DEMO · 실제 DB손해보험 서비스가 아닙니다.** 이웃 수는 시뮬레이션이며 기록은 브라우저별입니다. 운영자 파라미터는 보안 인증 기능이 아닙니다. 상용 운영 전 브랜드·캐릭터 권리와 법무·준법·개인정보 검토가 필요합니다.
