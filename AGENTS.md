# AGENTS.md — DB PROMY World / Codex Development Contract

## Mission
Continue the existing browser-playable 3D world in this repository, not a replacement marketing landing page. The target is a polished 2027 brand-experience demo with daily check-in as the CORE loop and promise campaign as the optional layer. Preserve the user's uploaded `약속우체국_v1.0_고도화_브리프_for_CODEX.md` as the authoritative acceptance specification.

## Non-negotiable character separation
1. **PC / PLAYER** — source image uploaded as `character-curl-sample.png` in the originating conversation. Cream/ivory rounded mascot with big spherical head, black-dot eyes, curved smiling mouth, an orange swooping curled topknot, orange horizontal band around torso, little ivory limbs. NOT the yellow Promy. All user-controlled avatars share this silhouette; variations via subtle lantern accent colors only.
2. **NPC / PROMY** — images embedded within the supplied `DB_프로미_캠페인_아이디어_제안.html`. Use the illustration alt `짧고 둥근 체형의 프로미 리디자인` and, critically, alt `프로미 기본형, 4방향, 의상 및 브랜드 역할 시트` (front / side / back / 3/4). Yellow asymmetrical scalloped head with tall rising corner, dark oval eyes, simple w-shaped mouth, rosy cheeks, deep green scarf tied near shoulder and cape, green feet, P speech-bubble emblem. NPCs and the Promy postmaster must use **this** character, not the cream/orange PC.
3. These images are VISUAL references, not actual ready-to-rig GLB files. Do not state that image extraction automatically yields a faithful rigged 3D mesh. Produce reference-faithful 3D GLB models with independent walk/wave/idle/cheer clips, using Blender if available. As a transition the main `world.html` contains code-generated three.js approximations.

## Product / content requirements
- Brand line: `그대로의 나를 위한, 함께 약속`; name: `약속 우체국`; character copy: `뿌듯한 나, 그대로.`; avoid the prohibited phrase `뿌듯한 지금의 나`.
- Core daily loop: `오늘의 그대로` — evening meal, finished the day, safely home. One of three is enough to count for the day, no guilt. Per-day idempotency and localStorage; persistent cumulative days and small streak, weekly grace coupon. Render a real house assigned to the player whose lights respond to the check-ins.
- Optional actions: promise → lantern → star on completion; greet; Promy scripted chat.
- Time of day KST; daily 21:00 lantern ritual; `?admin=1` demo override and `?spectate=1` audience perspective. Never report simulated presence as actual live attendance.
- Share cards 9:16 and 1:1; optional daily cards and manual 30s timelapse. Mark AI-generated elements.
- No install, login, free-form input or chat in v1. No product/coverage/purchase copy, no promise text storage. Do not promise automatic legal exemption: compliance review is required.
- Retain public demo disclaimer, specifically not a real DB손해보험 service.

## Engineering / QA
- Organize in `src/world`, `src/systems`, `src/ui`, `src/data`, `assets/glb`; use a single state store and versioned persistence. Maintain GitHub Pages-compatible relative imports.
- Prefer optimized GLB + palette atlas, instanced vegetation and lanterns, max 8 real dynamic point lights, desktop/mobile quality tiers and 2D fallback.
- Test creation, play loop, reload persistence, KST midnight crossing, mobile controls, 21:00 show, no-3D fallback, and 6-device concurrent demo. Real multiplayer requires a backend; do not claim synchronized attendance before implementing one.
- Existing `world.html` v0.4 includes partial procedural replacements and visual effects; do not erase the prior functional interactions without replacement.
- GitHub repository is PUBLIC. Do not check in client-private RFP, transcript, account data, confidential brief or source HTML without user authorization. Asset rights and character IP approval needed before public commercial launch.

## Planned priorities
1. Extract references into `assets/references` only if the user authorizes their public upload; create genuine production GLB character assets and full 3D motions.
2. Modularize and implement persistent daily core loop.
3. Add time-of-day + check-in home response + admin/spectator.
4. Share/image/video pipeline and performance test.
5. Rehearse 2026-11-26 six-phone PT sequence with actual network constraints and offline fallback.
