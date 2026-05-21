# ShadowSpeak — English Shadowing & Dictation App

A Next.js 14 + TypeScript + Tailwind CSS application for learning English through shadowing and dictation exercises.

## Features

- **Shadowing Practice** — Listen to audio chunks and record yourself repeating them
- **Dictation Practice** — Listen and type what you hear; get word-by-word feedback
- **Progress Tracking** — Track completed lessons, total minutes, dictation accuracy, and daily streak
- **Admin Panel** — Teachers and admins can add/edit/delete custom lessons
- **Mock Auth** — No real backend needed; uses localStorage + cookie

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| `admin@test.com` | any | Admin |
| `teacher@test.com` | any | Teacher |
| any other email | any | Student |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: Mock (localStorage + cookie) — Supabase ready
- **Data**: JSON files + localStorage — Supabase ready
- **Audio**: HTML5 `<audio>` + browser `speechSynthesis` API
- **Recording**: `MediaRecorder` Web API

## Project Structure

```
shadowing-app/
├── app/
│   ├── layout.tsx              # Root layout with Navbar
│   ├── page.tsx                # Home page
│   ├── login/page.tsx          # Login form
│   ├── register/page.tsx       # Registration form
│   ├── lessons/page.tsx        # Lesson list with filters
│   ├── shadowing/[id]/page.tsx # Shadowing lesson player
│   ├── dictation/[id]/page.tsx # Dictation lesson
│   ├── progress/page.tsx       # Progress dashboard
│   └── admin/page.tsx          # Admin/teacher panel
├── components/
│   ├── Navbar.tsx              # Responsive nav with hamburger
│   ├── AudioPlayer.tsx         # Audio player with speed control
│   ├── Recorder.tsx            # MediaRecorder component
│   ├── ChunkPlayer.tsx         # Shadowing chunk practice
│   ├── DictationInput.tsx      # Dictation input + checking
│   └── ProgressCard.tsx        # Stat card component
├── lib/
│   ├── auth.ts                 # Mock auth (localStorage)
│   ├── progress.ts             # Progress tracking (localStorage)
│   └── dictation.ts            # Answer checking logic (LCS diff)
├── data/
│   ├── shadowing-lessons.json  # 10 shadowing lessons
│   └── dictation-lessons.json  # 10 dictation lessons
└── middleware.ts               # Route protection via cookie
```

## Content

### Shadowing Lessons (10)
- Topics: School (2), Hobbies (2), Family (2), Food (2), Daily Routine (2)
- Levels: Starter (4), Level 1 (3), Level 2 (3)
- Each lesson has 4 chunks for shadowing practice

### Dictation Lessons (10)
- Topics: School (2), Hobbies (2), Family (2), Food (2), Daily Routine (2)
- Subtypes: Sentence (4), Dialogue (3), Paragraph (3)
- Levels: Starter (4), Level 1 (3), Level 2 (3)

## Audio

Since no real audio files are included, the app uses the browser's built-in **Web Speech API** (`speechSynthesis`) to speak lesson text. This works in all modern browsers. To add real audio, set the `audioUrl` field in the JSON data files.

## Supabase Integration (Future)

The app is architected to plug in Supabase later:
- Replace `lib/auth.ts` with Supabase Auth
- Replace `lib/progress.ts` with Supabase queries
- Admin panel already has a form structure ready for Supabase Storage uploads

## Build

```bash
npm run build
npm start
```
