# Doon Tech Community Pokedex

A collectible attendee index for every face in the Doon Tech Community.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Appwrite TablesDB, Auth (email OTP), Storage
- Server-side rendering throughout — server components for reads, server actions for writes/auth/upload
- Dynamic OG images via `next/og`

## First-time Appwrite setup

1. Install the Appwrite CLI and log in:

   ```powershell
   npm i -g appwrite-cli
   appwrite login
   ```

2. From the project root, push the schema defined in `appwrite.config.json`:

   ```powershell
   appwrite push tables
   appwrite push buckets
   ```

   This provisions the `dtc` database, the six tables (`attendees`, `tags`, `meetups`, `badges`, `attendee_badges`, `featured`), and the `avatars` storage bucket.

3. Create a server API key (Project → Overview → Integrations → API Keys) with scopes:
   - `databases.read`, `databases.write` — used by every `adminTables()` row CRUD call
   - `users.read` — `users.list` / `users.get` (organizer-access lookup)
   - `users.write` — `users.updateLabels` (granting the `organizer` label) and `users.updateName` (profile setup)
   - `files.read`, `files.write` — avatar uploads via `adminStorage().createFile`
   - `sessions.write` — `adminAccount().createSession` (SSR receives `session.secret` and sets the cookie); also implicitly required by `createEmailToken` for the OTP flow

4. Copy `.env.example` to `.env.local` and fill in:

   ```ini
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=dtc-pokedex
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=dtc
   NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS=avatars
   APPWRITE_API_KEY=...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

5. Make yourself an organizer. Sign in once (see "Run locally" below), then in the Appwrite console open the user record and add the label `organizer` (Users → your user → Labels → `+ organizer`). The app gates all admin actions on this label.

## Run locally

```powershell
npm install
npm run dev
```

Open <http://localhost:3000>.

### Sign in

- Visit `/login` (or click **Sign in** on `/admin`)
- Enter your email — Appwrite emails you a 6-digit code
- Enter the code; the session cookie is set server-side and you're in
- Signed-in users without a linked attendee card are sent to `/profile/setup`
- Completing setup creates an active public attendee profile linked to the user's Appwrite `$id`
- Users with the `organizer` label see the full admin dashboard at `/admin`

### Self-claim

A user can edit their own attendee profile when `attendee.user_id` matches their Appwrite `$id`:

- Organizer flow: edit any attendee → fill **Linked user ID** with the user's `$id` (from the Appwrite console)
- Self-claim flow: `claimAttendee(attendeeId)` server action sets `user_id` if the attendee is unclaimed (currently no UI button — wire as needed)

### Level calculation

Attendee levels are derived from earned or hard-to-fake signals. Users and organizers do not manually set levels in the UI.

The source formula lives in `lib/levels.ts`:

```txt
xp = profile completeness XP + badge rarity XP + tenure XP
level = highest nonlinear threshold reached by xp
```

Profile completeness is capped at 80 XP:

- 10 XP for avatar
- 10 XP for role/title
- 10 XP for company
- 10 XP for location
- 10 XP for a bio of at least 40 normalized characters
- 10 XP for at least one social/personal link
- 5 XP for one tag, 10 XP for two or more tags
- 10 XP for preferred stack or favorite topic

Badge XP uses rarity:

- common: 25 XP
- rare: 75 XP
- epic: 180 XP
- legendary: 400 XP

Tenure adds 5 XP per full month since the attendee row was created, capped at 60 XP.

`attendees.level` is a server-computed cache used for display/sorting fallback. It is recalculated when profiles are created or updated, badges are awarded or removed, attendees are merged, and tags are removed from attendees. The `/dex?sort=level` query recomputes levels from live profile, badge, and tenure data for the filtered result set before sorting; currently this live sort caps the filtered set at 1000 attendees.

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – production build
- `npm start` – run the production build
- `npm run typecheck` – TypeScript check

## Project structure

```
app/
  layout.tsx, page.tsx, globals.css
  login/ (email OTP form)
  dex/page.tsx (Pokédex grid)
  attendees/[slug]/page.tsx (profile)
  events/page.tsx (link list)
  profile/page.tsx, profile/setup/page.tsx (self-service profile)
  admin/page.tsx (organizer dashboard)
  admin/attendees/new + [id]/edit (forms, with AttendeeBadgesPanel)
  admin/events/page.tsx (event creation)
  admin/tags/page.tsx (tag creation)
  admin/badges/page.tsx (badge creation)
  og/route.tsx (OG images)
  sitemap.ts, robots.ts, not-found.tsx, icon.svg, apple-icon.tsx
components/
  Nav, NavLinks, AttendeeCard, AttendeeForm, OrganizerAuthButton
  Avatar, TagChip, BadgePill, FiltersBar
  PokedexTilt, PowerButton, DeviceControls, SoundProvider
  (admin: BadgesAdmin, EventsAdmin, TagsAdmin, AdminAttendeesTable)
lib/
  appwrite.ts (server clients, IDs, helpers)
  auth.ts (getCurrentUser, isOrganizer, requireOrganizer)
  levels.ts (profile/badge/tenure XP and level thresholds)
  queries.ts (Appwrite reads for pages)
  actions.ts (server actions: OTP, CRUD, upload, merge, claim)
  types.ts
appwrite.config.json (Appwrite CLI schema)
```

## Notes

- All writes go through server actions in `lib/actions.ts`. They authenticate the request via the session cookie, enforce the `organizer` label (or `user_id` match for self-edits), and use the admin API key to perform the mutation.
- Organizers can add events from `/admin/events`; new records appear on `/events` and update the dashboard count.
- Organizers can add tags from `/admin/tags`; new tags appear in filters and attendee profile forms.
- Organizers can create badges from `/admin/badges` and award them to attendees via the **Badges** panel on each attendee's edit page (`/admin/attendees/[id]/edit`). Awarded badges are stored in `attendee_badges` and render as `BadgePill`s on the profile page.
- Avatars upload to the `avatars` bucket; `avatar_file_id` on the attendee references the file. The public view URL is built by `avatarUrl(fileId)` in `lib/appwrite.ts`.
- The OTP flow uses Appwrite's `Account.createEmailToken` + `Account.createSession` through the server SDK admin client. The session secret is stored in an HTTP-only `a_session_<PROJECT_ID>` cookie and passed back to Appwrite with `setSession()`.
