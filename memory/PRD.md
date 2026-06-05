# ARKETYPE — Product Requirements

## Original Problem Statement
Build ARKETYPE — an award-winning, cinematic, highly interactive *experimental creative agency* website (not a digital/web agency). Inspired by Airborne Studio. Must feel alive, tactile, cinematic, rebellious, handcrafted, immersive, unforgettable.

Reference materials provided by user:
- Logo (black on off-white, oversized Druk-style wordmark "ARKETYPE.")
- Master prompt PDF (5 phases: Hero physics, Manifesto, Work showcase, Gamification, Mega footer)
- Architecture research PDF
- Workplan PDF (clarifying it's an Experimental Creative Agency, not web-only)

## Stack (User-confirmed)
- React (CRA) + FastAPI + MongoDB (Next.js requested in brief, but our platform requires CRA — user OK with this)
- Animation: GSAP + ScrollTrigger, Matter.js (physics), Lenis (smooth scroll), Framer Motion
- Auth: JWT (httpOnly cookies + localStorage Bearer fallback for cross-site safety)

## User Personas
- **Prospective clients** — creative directors, founders, marketing leads scouting an experimental agency
- **Agency admin** — internal team managing inquiries, projects (CMS), newsletter subscribers
- **Curious visitors** — designers/developers exploring the experience

## Core Requirements (Static)
1. Cinematic dark aesthetic (matte black #0E0E0E, off-white #F2EFEA, neon accents on interaction)
2. Oversized geometric display type (Archivo Black + Space Grotesk + JetBrains Mono)
3. Physics-driven hero — letters of "ARKETYPE." are individual rigid bodies (Matter.js) with gravity, collisions, drag
4. Custom magnetic cursor with contextual states (link/drag) and labels
5. Smooth Lenis scroll across whole experience
6. Splash loader with progress bar
7. Manifesto with kinetic cursor-reactive text
8. Horizontal pinned-scroll work showcase
9. Disciplines (Services) — 4 cards + 4-step process strip
10. Studio / Team section (added based on workplan)
11. Mega footer with cursor-reactive proximity typography, contact form, newsletter
12. Floating "LET'S WORK" magnetic CTA bottom-right
13. Konami code easter egg → chaos-mode (invert + shake) for 6s
14. Admin auth + dashboard with 3 tabs: Inquiries, Projects (CMS), Newsletter
15. Public REST API for projects (from MongoDB CMS)

## Implementation Status (2026-05-24)

### Backend (`/app/backend/server.py`)
✅ FastAPI app with `/api` prefix; CORS with `allow_origin_regex` + credentials
✅ JWT auth (PyJWT, HS256, 60min access + 7d refresh)
✅ bcrypt password hashing
✅ Admin seeding from env (`ADMIN_EMAIL`/`ADMIN_PASSWORD`)
✅ Brute-force lockout (5 attempts / 15min), with X-Forwarded-For IP extraction (ingress-aware)
✅ 6 sample projects auto-seeded on first startup
✅ Public endpoints: `/api/`, `/api/contact`, `/api/newsletter`, `/api/projects`
✅ Auth endpoints: `/api/auth/login`, `/me`, `/logout`, `/refresh`
✅ Admin endpoints: `/api/admin/contacts` (list, mark read, delete), `/api/admin/newsletter` (list, delete), `/api/admin/projects` (full CRUD)
✅ Mongo indexes: `users.email` unique, `newsletter.email` unique, `login_attempts.identifier`, `projects.order`, `contacts.created_at`

### Frontend (`/app/frontend/src/`)
✅ Splash loader (3s) with progress + letter cascade
✅ Custom magnetic cursor (GSAP, contextual hover states & labels)
✅ Lenis smooth scroll wrapper
✅ HeroPhysics — Matter.js letter sandbox with overlay text rendering
✅ PartnerMarquee — infinite logos strip
✅ Manifesto — 4 statements with cursor-reactive wobble
✅ WorkGallery — GSAP pinned horizontal scroll, 6 cards
✅ Services (Disciplines) — 4 services + 4-step process
✅ Studio — 6-person team list with hover accent colors
✅ MegaFooter — proximity-typography headline, contact form, newsletter, marquee tail, admin link
✅ FloatingCTA — magnetic LET'S WORK button → smiley morph
✅ KonamiCode — global keyboard listener with progress indicator
✅ Admin Login + protected Dashboard (3 tabs, full CRUD UIs)
✅ Sonner toasts, Sonner / shadcn aesthetic preserved

### Test Status (Iteration 3)
- Backend: 19/20 pytest cases pass (1 brute-force test failed pre-fix due to ingress IP rotation — now fixed via X-Forwarded-For)
- Frontend: All section testids verified; hero physics canvas confirmed; admin/UI flows queued for next test pass

## Known Tradeoffs
- Optional sound/sensory layer from workplan not implemented (no audio assets provided)
- Mobile gyroscope motion deferred (touch-first responsive behaviour preserved but no gyro)
- No GLSL shaders yet — relied on CSS / Matter.js / GSAP for motion fidelity
- WebGL particle background from brief deferred to keep first build performant

## P1 / Next Backlog
- Add an Interactive About section (workplan calls for it explicitly) — currently merged into hero + manifesto
- Project detail pages with FLIP transition from card → fullscreen
- GLSL liquid distortion on project card images (cursor-reactive)
- Subtle ambient audio + hover sound design
- Mobile-specific gyroscope tilt on hero physics
- Email notifications when a new inquiry comes in (Resend/SendGrid)
- Visual edit for project order (drag-and-drop) in admin

## Credentials
See `/app/memory/test_credentials.md`
