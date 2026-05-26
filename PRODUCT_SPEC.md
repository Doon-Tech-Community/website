# Doon Tech Community Pokedex
> A collectible attendee index for every face in the Doon Tech Community.

## Overview
A web app that catalogs every attendee from Doon Tech Community meetups as Pokédex-style profile cards. The app lets visitors browse, search, and filter attendees, view their meetup history, and explore fun community metadata like specialties, tech stack, favorite topics, and attendance badges. Organizers can create and edit attendee profiles, import attendees from meetups, and manage attendance records. The experience is playful, visual, and community-first, while still being useful as a living member directory for the Dehradun tech scene.

## Target Audience
### Community attendee
- **Needs:** Browse people they met at meetups, remember names, and learn what others build and talk about.
- **Pain points:** Forgets names after events, has no easy way to find attendees by interests, and wants a fun reason to revisit the community.

### Community organizer
- **Needs:** Maintain an up-to-date attendee catalog, add new meetup attendees quickly, and keep profile data consistent.
- **Pain points:** Manually tracking attendance is tedious, profile data is incomplete, and updates are hard to manage after events.

### Newcomer to Doon Tech Community
- **Needs:** Discover who attends, what kinds of people are in the community, and who to connect with at future events.
- **Pain points:** Feels disconnected before the first meetup and lacks context on the people in the room.

## Features
### Attendee Pokedex _(P0)_
A browsable grid of attendee profile cards with avatar, name, role, specialties, and attendance count.
- **User value:** Makes the community feel collectible and easy to explore at a glance.

### Attendee profile pages _(P0)_
Detailed profile pages with bio, current role, company, social links, meetup history, badges, and fun stats.
- **User value:** Helps members remember people and understand their interests quickly.

### Search and filters _(P0)_
Search attendees by name, company, role, tags, meetup attended, and skill set.
- **User value:** Lets users find the right person fast without scrolling the whole directory.

### Organizer attendee management _(P0)_
Admin tools to create, edit, archive, and merge attendee profiles.
- **User value:** Keeps the directory accurate and maintainable after every meetup.

### Meetup index _(P0)_
A simple read-only list of past and upcoming Doon Tech Community meetups, each linking out to its external event page (e.g. Luma).
- **User value:** Gives newcomers and members a quick history of what the community has run, without duplicating event-platform features.

### Badge and rarity system _(P1)_
Award playful badges such as first meetup, frequent attendee, speaker, mentor, or open source contributor.
- **User value:** Adds gamification and encourages participation.

### Featured attendees and spotlights _(P1)_
Highlight selected members on the homepage or a special spotlight section.
- **User value:** Makes it easy to introduce active community members and speakers.

### Public profile sharing _(P1)_
Generate shareable links for attendee profiles with social preview metadata.
- **User value:** Helps attendees share their presence and increases community visibility.

### Community stats dashboard _(P2)_
Show metrics like total attendees, most common skills, most attended meetup, and active cities or companies.
- **User value:** Provides useful insight into the community composition.

## User Stories
- As a community attendee, I want to browse attendee cards so that I can remember who I met at previous meetups.
- As a newcomer, I want to search by interests and job roles so that I can find people relevant to me.
- As an organizer, I want to create and edit attendee profiles so that the Pokedex stays accurate.
- As a community attendee, I want to open a profile page so that I can learn more about someone before reaching out.
- As a newcomer, I want to see the list of past and upcoming meetups so that I can jump to the event page and join the next one.
- As an organizer, I want to award badges so that I can make participation feel fun and recognizable.
- As an organizer, I want to feature selected attendees so that I can spotlight speakers and active members.

## Design Spec
**Look & feel:** A 90s handheld Pokédex device, rendered in HTML/CSS. The entire viewport sits inside a coral-red plastic chassis that tilts in 3D on cursor movement, with a recessed light-blue glass LCD screen as the actual content area. Frosted-glass card tiles for content, chunky beveled plastic buttons, pixel-font headings, and faint CRT scanlines across the screen. The device chrome is functional: D-pad navigates between attendees, A-button opens the focused profile, a power button toggles boot state, and a speaker grille mutes click sounds. The aesthetic is unapologetically retro, but the layout under the chrome is a modern responsive card grid.

**Typography:**
- **Display / headings / chips / buttons / labels:** `Press Start 2P` (pixel font, via `next/font/google`). Used for h1–h3, the `.pixel` utility, chip text, button labels, and the v-LCD tag lines. Small sizes (0.55–0.7rem) to stay legible.
- **Body / inputs / stat values:** `VT323` (monospace LCD-style font). Set as the body default at 18px with light letter-spacing.

**Color palette (implemented):**
- Chassis (coral plastic): `#F26B6F` shell · `#FFA8AB` highlight · `#E6585D` mid · `#B8383D` low · `#7A1F23` deep · `#3A0A0D` ink (outlines)
- Glass LCD screen: `#E6F4FB` haze · `#B7E1F5` lite · `#5BA8D4` mid · `#1E5A82` deep
- Ink (readable on glass): `#0B2A3E` ink · `#2F5670` ink-soft · `#5B7E97` ink-mute
- LED indicators: `#6CCFF6` blue · `#FF6B6F` red · `#FFD54F` yellow · `#5DE39A` green
- Page outside chassis: dark wine `#2A1416 → #1A0A0C` with two soft radial-glow accents (coral + glass-blue) so the device floats
- Rarity chip variants: `rare` (lavender/purple), `epic` (gold), `legendary` (coral), `success` (green) — all rendered as beveled plastic chips

**Component language:**
- `.dex-shell` — the chassis: glossy coral-plastic gradient with multi-layer drop shadow stacked beneath it for visible thickness when tilted, plus four corner screw-bump dots and a horizontal panel seam.
- `.lcd-panel` — the screen: tinted light-blue glass with subtle scanlines, a top-left gloss highlight, chrome+ink bezel, and inset shadow to feel recessed into the chassis.
- `.led-lens` — the big animated Pokédex eye: radial-gradient blue lens with pulsing glow, chrome bezel, and a sparkle highlight.
- `.led` — small status dots (red/yellow/green) with inset shine and currentColor outer glow.
- `.card-frame` — frosted-glass card tile (`backdrop-filter: blur(6px)`) with a top-left sheen, a 3px hover lift, and a soft cyan glow on hover.
- `.stat-block` — small inset glass tile for numeric stats (used in profile and admin headers).
- `.chip` — pixel-font tag/badge pill with inset bevel. Variants drive rarity colors. Active filter chips switch to the blue button gradient.
- `.btn` — chunky 3D plastic button with 4px bottom-slab depth and `:active { translateY(3px) }` press feel. Variants: default (coral), `btn-primary` (blue glass), `btn-ghost` (glass), `btn-danger` (dark red).
- `.input` — glass field with inset shadow and a yellow focus ring; selects use a CSS-only chevron via background gradients.
- `.dpad` / `.action-btn` / `.speaker-grille` / `.pwr-btn` — functional device controls below the screen (`DeviceControls`, `PowerButton`, `SoundProvider`).

**Motion & interaction:**
- `PokedexTilt` rotates the chassis a few degrees toward the cursor via CSS variables (`--tilt-x`, `--tilt-y`). The screen contents stay flat — the chassis moves around them.
- Focus outline is a 3px solid yellow (`#FFD54F`) at 2px offset — visible on every focusable element.
- Card hover lifts 3px with extra cyan glow; buttons press down 3px.
- All transforms and the lens pulse animation are disabled under `prefers-reduced-motion`.
- `SoundProvider` plays soft click ticks on button presses; the speaker grille toggles mute (persisted, with a green LED when on and a slash overlay when muted).

**Accessibility & responsiveness:**
- Skip-to-content link at the top of `<body>`.
- All controls reach via keyboard; chip filters use `aria-pressed`, pagination uses `aria-current="page"`.
- Color contrast is verified against the light-blue glass screen background, not the dark outside chassis — body ink stays at `#0B2A3E` on `#E7F6FD–#7ABDDE`.
- Chassis is capped at `max-w-6xl` and shrinks padding on small screens; the attendee grid steps down from 4 → 3 → 2 → 1 columns.
- 3D tilt and decorative chrome degrade gracefully under reduced motion.

### Key screens
- **Landing (`/`):** Boot screen inside the LCD. "SYSTEM READY" LED row, two-line pixel title `DOON TECH COMMUNITY`, intro paragraph in VT323, three stat blocks (Developers / Meetups / Tags), a primary `▶ ENTER POKÉDEX` button, keyboard hint `PRESS A OR ENTER TO START`, and small secondary links to `Meetups →` and `Admin →`.
- **Pokédex Grid (`/dex`):** Header with a coral `►` bullet, pixel `THE POKÉDEX` title, and a one-line description. Below it: a search input + sort dropdown row, a horizontal row of tag-filter chips (active chips switch to the blue button gradient), a result-count + page-count strip, the attendee card grid, a chip-style pagination row, and a glass empty-state card when filters return nothing.
- **Attendee Profile (`/attendees/[slug]`):** A frame card with a coral→badge→gold gradient banner, large square avatar overlapping the banner, name with a `LVL N` epic chip, role · company, location, tag chips, and a small stat block grid (Badges / Level). Below: a two-column layout — Bio + Developer Card (preferred stack, favorite topic, company, location) on the left; Badges, Social Links, and Related Attendees on the right.
- **Organizer Dashboard (`/admin`):** Logged-out state shows a centered glass card prompting organizer sign-in. Signed in: page title with a green `ORGANIZER` chip, a `+ New developer` primary button, three stat blocks (Attendees / Meetups / Tags), and the attendees table with search, edit/archive row actions, and a merge mode that selects a source and target.
- **Meetups (`/meetups`):** A simple two-column grid of glass cards. Each card shows the title, an `upcoming` (gold) or `completed` (green) chip derived from the date, the date line, a two-line description, and an `Open event ↗` link. The whole card links out to the external event URL.

## Data Model
### user
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Unique user identifier. |
| createdAt | datetime | Account creation timestamp. |
| updatedAt | datetime | Last account update timestamp. |
| name | string | Display name. |
| email | string | Login email. |
| role | string | Values: organizer, member. |
| avatar_url | string | Profile image URL. |
**Relationships:** Represents an authenticated account. Organizers can manage the Pokedex; regular members can browse and optionally edit their own profile if allowed.

### attendee
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Unique attendee identifier. |
| createdAt | datetime | Record creation timestamp. |
| updatedAt | datetime | Last record update timestamp. |
| name | string | Full name. |
| slug | string | URL-friendly profile identifier. |
| bio | string | Short community bio. |
| role_title | string | Job title or community role. |
| company | string | Current company or organization. |
| location | string | City, usually Dehradun or nearby. |
| avatar_url | string | Profile picture. |
| cover_image_url | string | Optional banner image. |
| linkedin_url | string | Optional social link. |
| github_url | string | Optional social link. |
| website_url | string | Optional personal site. |
| status | string | Values: active, archived. |
| user_id | string | Optional link to a user account for self-service editing. |
**Relationships:** Primary directory entity. An attendee may be linked to one user account and can have many attendance records and badges.

### tag
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Unique tag identifier. |
| createdAt | datetime | Creation timestamp. |
| updatedAt | datetime | Update timestamp. |
| name | string | Tag label such as Flutter, AI, DevOps, Product. |
| type | string | Values: skill, interest, industry, topic. |
**Relationships:** Reusable interest or skill label. Many attendees can have many tags.

### attendee_tag
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Unique join record identifier. |
| createdAt | datetime | Creation timestamp. |
| updatedAt | datetime | Update timestamp. |
| attendee_id | string | References attendee. |
| tag_id | string | References tag. |
**Relationships:** Join table linking attendees and tags.

### meetup
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Unique meetup identifier. |
| createdAt | datetime | Creation timestamp. |
| updatedAt | datetime | Update timestamp. |
| title | string | Meetup name. |
| description | string | Event summary. |
| date | date | Event date. |
| external_url | string | Link to the external event page (e.g. Luma). |
**Relationships:** Standalone reference to a Doon Tech Community event. Attendance is not tracked in this app.

### badge
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Unique badge identifier. |
| createdAt | datetime | Creation timestamp. |
| updatedAt | datetime | Update timestamp. |
| name | string | Badge name. |
| description | string | What the badge means. |
| icon | string | Icon name or asset key. |
| rarity | string | Values: common, rare, epic, legendary. |
**Relationships:** Reusable achievement that can be assigned to many attendees.

### attendee_badge
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Unique join record identifier. |
| createdAt | datetime | Creation timestamp. |
| updatedAt | datetime | Update timestamp. |
| attendee_id | string | References attendee. |
| badge_id | string | References badge. |
| awarded_at | datetime | When the badge was awarded. |
**Relationships:** Join table linking attendees and badges.

### featured_attendee
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Unique feature record identifier. |
| createdAt | datetime | Creation timestamp. |
| updatedAt | datetime | Update timestamp. |
| attendee_id | string | References attendee. |
| start_at | datetime | Feature start time. |
| end_at | datetime | Feature end time. |
| priority | number | Ordering value. |
**Relationships:** Stores which attendees are highlighted on the homepage for a given time window.

## API Schema
### `GET /attendees`
List attendees with search, filters, sorting, and pagination.
- **Request:** None
- **Response:** [{ id, name, slug, role_title, company, avatar_url, tags[], badge_count }]

## Recommended Tech Stack
- **Frontend:** Next.js with TypeScript and Tailwind CSS
- **Backend:** Appwrite
- **Database:** Appwrite TablesDB
- **Auth:** Appwrite Auth
- **Hosting:** Appwrite Sites for frontend, Appwrite Cloud for backend
- **Notes:** Next.js is a strong fit for a content-rich, shareable public directory. Appwrite gives managed auth, database, and access control, and Appwrite Storage can handle avatars, cover images, and badge assets.

## Non-Functional Requirements
- Load the attendee grid in under 2 seconds for typical community-size datasets and keep profile pages responsive under normal traffic.
- Meet WCAG AA accessibility standards with keyboard navigation, sufficient color contrast, semantic headings, and accessible filter controls.
- Use a responsive layout that works well on mobile, tablet, and desktop, with the attendee grid collapsing gracefully on smaller screens.
- Protect organizer actions with role-based access control and require authenticated sessions for create, edit, archive, badge assignment, and attendance management.
- Sanitize all user-generated content, validate uploaded images, and enforce file type and size limits for avatars and cover images.
- Use caching and pagination or infinite loading to keep browsing fast as the attendee list grows.

## Open Questions
- Should attendees be publicly visible to anyone, or only to logged-in community members?
- Do you want attendees to be able to claim and edit their own profiles, or should only organizers manage profiles?
- Should the app include playful stat fields like 'preferred stack', 'favorite topic', and 'level' to make it feel more like a true Pokédex?
