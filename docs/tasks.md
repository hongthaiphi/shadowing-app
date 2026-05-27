# Tasks — English Shadowing & Dictation Website

> Dựa trên `requirements.md`. Ưu tiên: 🔴 Must → 🟡 Should → 🟢 Could

---

## PHASE 1 — Project Setup

### T-01 Khởi tạo dự án
- [x] T-01-1 Tạo Next.js 14 + TypeScript + Tailwind CSS
- [x] T-01-2 Cấu hình ESLint, Prettier, tsconfig
- [x] T-01-3 Cài đặt Supabase client (`@supabase/supabase-js`) — *installed, connected*
- [x] T-01-4 Cấu hình biến môi trường `.env.local` — *NEXT_PUBLIC_SUPABASE_URL + ANON_KEY set*
- [x] T-01-5 Thiết lập cấu trúc thư mục (`app/`, `components/`, `lib/`, `data/`)
- [x] T-01-6 Deploy skeleton lên Vercel

### T-02 Database Schema (Supabase)
- [x] T-02-1 Tạo bảng `users` — *`profiles` table (id, email, name, role) + trigger auto-create on signup*
- [ ] T-02-2 Tạo bảng `lessons` — *bài học vẫn dùng JSON file, chưa migrate lên Supabase*
- [x] T-02-3 Tạo bảng `progress` — *(user_id, lesson_id, lesson_type, time_spent, score, completed_at)*
- [x] T-02-4 Tạo bảng `dictation_attempts` — *merged vào bảng `progress` (score field)*
- [ ] T-02-5 Tạo bảng `streaks` — *streak hiện tính từ progress data, chưa có bảng riêng*
- [x] T-02-6 Cấu hình Row Level Security (RLS) Supabase — *profiles + progress có RLS*
- [x] T-02-7 Tạo Supabase Storage bucket cho audio và image — *bucket `audio` (public) đã tạo, chứa shadowing + dictation MP3*
- [x] T-02-8 Tạo bảng `reading_lessons` — *`supabase/migrations/001_reading_writing.sql`: id TEXT PK, title, level, topic, image_url, word_count, duration_minutes, paragraphs JSONB, questions JSONB + RLS*
- [x] T-02-9 Tạo bảng `reading_questions` — *merged vào `reading_lessons.questions` JSONB column (multi-type: MC/TF-NG/fill-blank/short-answer)*
- [x] T-02-10 Tạo bảng `writing_lessons` — *`supabase/migrations/001_reading_writing.sql`: id TEXT PK, task_type, word_target, prompt, requirements JSONB, suggested_ideas JSONB, suggested_vocabulary JSONB, suggested_structure JSONB + RLS*
- [x] T-02-11 Tạo bảng `writing_submissions` — *`supabase/migrations/001_reading_writing.sql`: id UUID PK, user_id FK→auth.users, lesson_id, content, word_count, saved_at; UNIQUE(user_id, lesson_id) + RLS (students own, teachers/admin read-all)*

---

## PHASE 2 — Authentication (FR-01)

- [x] T-03-1 🔴 Trang đăng ký `/register` — form email + password
- [x] T-03-2 🔴 Trang đăng nhập `/login` — *Supabase Auth thật, error messages cụ thể*
- [x] T-03-3 🔴 Đăng xuất + clear session
- [x] T-03-4 🔴 Middleware bảo vệ route (redirect nếu chưa login)
- [x] T-03-5 🔴 Phân quyền role: student / teacher / admin
- [x] T-03-6 🟡 Forgot password — gửi email reset — */forgot-password + /reset-password, Supabase resetPasswordForEmail, onAuthStateChange PASSWORD_RECOVERY*
- [ ] T-03-7 🟢 Đăng nhập Google OAuth

---

## PHASE 3 — Layout & Navigation

- [x] T-04-1 🔴 Layout chung: header + main + footer
- [x] T-04-2 🔴 Navigation: Home / Lessons / Progress / Login
- [x] T-04-3 🔴 Mobile-responsive navigation (hamburger menu)
- [x] T-04-4 🔴 Active link highlight
- [x] T-04-5 🟡 Teacher/Admin link (chỉ hiện với role phù hợp)

---

## PHASE 4 — Trang Home (FR-02)

- [x] T-05-1 🔴 Hero section: headline + subheadline + nút "Start Practising"
- [x] T-05-2 🔴 4 Feature cards: Shadowing / Dictation / Speaking / Progress
- [x] T-05-3 🟡 Demo preview: audio player + record button + transcript + dictation box
- [x] T-05-4 🟡 Responsive layout (1 cột mobile / 2 cột desktop)

---

## PHASE 5 — Lesson List (FR-03-1)

- [x] T-06-1 🔴 Trang `/lessons` — hiển thị danh sách bài học
- [x] T-06-2 🔴 Filter theo **level** (Starter / Level 1 / Level 2)
- [x] T-06-3 🔴 Filter theo **topic** (school / hobbies / family / food / daily routine)
- [x] T-06-4 🔴 Filter theo **type** — *shadowing / dictation / speaking / reading / writing — tất cả 5 loại ✅*
- [x] T-06-5 🟡 Filter theo **trạng thái** (New / Completed)
- [x] T-06-6 🟡 Lesson card: thumbnail + tiêu đề + level + thời lượng + badge completed
- [x] T-06-7 🟡 Pagination hoặc infinite scroll — *12 bài/trang, reset khi đổi filter*
- [x] T-06-8 🔴 Thêm routing cho lesson cards → `/reading/[id]` và `/writing/[id]` — *href logic đầy đủ 5 loại*
- [x] T-06-9 🔴 Load data từ `reading-lessons.json` và `writing-lessons.json` trong trang lessons — *60 lessons tổng*

---

## PHASE 6 — Shadowing Lesson (FR-03)

- [x] T-07-1 🔴 Trang `/shadowing/[id]` — layout bài học
- [x] T-07-2 🔴 Hiển thị tiêu đề, hình ảnh, transcript
- [x] T-07-3 🔴 Audio player — normal speed
- [x] T-07-4 🔴 Audio player — slow speed (toggle 0.75x)
- [x] T-07-5 🔴 Chunk display: hiển thị từng chunk, highlight chunk đang luyện
- [x] T-07-6 🔴 Nút Record — ghi âm giọng học sinh (MediaRecorder API)
- [x] T-07-7 🔴 Replay bản ghi âm của học sinh
- [x] T-07-8 🔴 Nút Try Again (xoá bản ghi, ghi lại)
- [x] T-07-9 🔴 Nút Mark Complete — lưu progress vào localStorage
- [x] T-07-10 🟡 Auto-advance: tự chuyển chunk tiếp theo sau khi ghi xong
- [x] T-07-11 🟡 Progress bar trong bài (chunk x/y)
- [x] T-07-12 🟢 AI pronunciation assessment (Azure Speech) sau khi ghi âm — *auto-assess sau record: overall score + per-word color-coded + fluency/completeness bars, `PronunciationResult` component*

---

## PHASE 7 — Dictation Lesson (FR-04)

- [x] T-08-1 🔴 Trang `/dictation/[id]` — layout bài học
- [x] T-08-2 🔴 Step 1: Nghe audio (player có replay + slow speed)
- [x] T-08-3 🔴 Step 2: Text input — học sinh gõ nội dung nghe được
- [x] T-08-4 🔴 Step 3: Nút Submit — kiểm tra đáp án
- [x] T-08-5 🔴 Step 4: Highlight lỗi sai (từ sai = đỏ, đúng = xanh, thiếu = xám)
- [x] T-08-6 🔴 Hiển thị đáp án đúng bên dưới
- [x] T-08-7 🔴 Nút Retry — thử lại bài
- [x] T-08-8 🔴 Lưu accuracy (%) vào localStorage sau mỗi lần làm
- [x] T-08-9 🟡 Show answer button (xem đáp án trước khi nộp)
- [x] T-08-10 🟡 Số lần đã thử + accuracy tốt nhất
- [x] T-08-11 🟡 Hỗ trợ 3 dạng: sentence / dialogue / paragraph

---

## PHASE 8 — Reading Lesson (FR-05)

- [x] T-09-1 🔴 Tạo `data/reading-lessons.json` — *10 bài (5 Starter + 3 Level 1 + 2 Level 2); schema: `{id, title, level, topic, type, paragraphs[], wordCount, questions[]}` — mỗi bài 5–6 câu hỏi mixed*
- [x] T-09-2 🔴 Trang `/reading/[id]` — split-screen layout desktop — *left 50% sticky `top-16 h-[calc(100vh-4rem)] overflow-y-auto`, right 50% natural scroll*
- [x] T-09-3 🔴 Left panel: title + image (optional) + reading passage — *passage render qua `AnnotatedParagraph` với `data-para-start` trên mỗi `<p>`*
- [x] T-09-4 🔴 Right panel: câu hỏi danh sách + ô trả lời — *`QuestionList` render 4 loại component*
- [x] T-09-5 🔴 Câu hỏi dạng Multiple Choice (A/B/C/D) — *radio buttons; sau submit: xanh = đúng, đỏ = sai*
- [x] T-09-6 🔴 Câu hỏi dạng True / False / Not Given — *button group 3 lựa chọn*
- [x] T-09-7 🔴 Câu hỏi dạng Fill in the Blank — *text input; accepted answers pipe-separated (`"science|Science"`), case-insensitive*
- [x] T-09-8 🔴 Câu hỏi dạng Short Answer — *textarea + model answer hiện sau submit + self-check checkbox*
- [x] T-09-9 🔴 Nút Submit All — *tính score tự động (MC + TF + FillBlank) + self-check ShortAnswer; hiển thị score banner*
- [x] T-09-10 🔴 Mobile: tab mode — *"📄 Passage" / "❓ Questions" sticky dưới navbar*
- [x] T-09-11 🔴 Highlight tool: bôi text trong passage → highlight màu — *TreeWalker-based char offset qua `data-para-start`; click span để xoá*
- [x] T-09-12 🔴 Font size adjustment (A+ / A-) — *4 mức: `text-sm → text-base → text-lg → text-xl`; disabled ở min/max*
- [x] T-09-13 🟡 Underline tool — *toggle giữa highlight và underline; underline dùng `decoration-blue-500`*
- [x] T-09-14 🟡 Lưu annotations vào localStorage — *key `reading_ann_{id}`; load khi mount, save mỗi khi thêm/xoá*
- [x] T-09-15 🟡 Nút Mark Complete + lưu progress — *`markComplete(id, timeSpent, score, 'reading')` → localStorage + Supabase fire-and-forget*
- [ ] T-09-16 🟢 Sticky notes bên cạnh passage
- [ ] T-09-17 🟢 Timer đếm thời gian làm bài
- [ ] T-09-18 🟢 Vocabulary popup khi click vào từ
- [x] T-09-19 🔴 Thêm `/reading` vào middleware PROTECTED_PATHS — *và matcher config*

---

## PHASE 9 — Writing Lesson (FR-06)

- [x] T-10-1 🔴 Tạo `data/writing-lessons.json` — *20 bài (8 Starter + 7 Level 1 + 5 Level 2); schema: `{id, title, level, topic, taskType, wordTarget, prompt, requirements[], suggestedIdeas[], suggestedVocabulary[], suggestedStructure: {introduction, body[], conclusion}}`*
- [x] T-10-2 🔴 Trang `/writing/[id]` — *split-screen desktop (left 40% sticky + right 60%); mobile tab "📋 Prompt & Ideas" / "✍️ Write"*
- [x] T-10-3 🔴 Part 1: Hiển thị writing prompt — *gradient card với task-type badge (Descriptive/Opinion/Narrative/Compare); requirements checklist; word target*
- [x] T-10-4 🔴 Part 2: Ideas/Outline support panel — *3 collapsible sections: 💡 Suggested Ideas, 📚 Vocabulary (clickable chips → insert tại cursor), 📋 Sample Structure; open/close độc lập*
- [x] T-10-5 🔴 Main writing box — *`<textarea>` Georgia serif, clean, placeholder = intro hint; disabled sau khi complete*
- [x] T-10-6 🔴 Word count real-time — *"56 / 100 words" + color progression (gray → amber 75% → green 100%) + progress bar animated*
- [x] T-10-7 🔴 Auto save vào localStorage — *key `writing_draft_{id}`; debounce 1.5s; load khi mount*
- [x] T-10-8 🔴 Thêm `/writing` vào middleware PROTECTED_PATHS — *và matcher config*
- [x] T-10-9 🟡 Draft saving + indicator — *"Saving…" spinner → "✓ Saved" → fade; flush ngay khi Mark Complete*
- [x] T-10-10 🟡 Nút Mark Complete — *soft warning nếu dưới target (không block); disabled nếu chưa gõ gì*
- [x] T-10-11 🟡 Lưu submission lên Supabase (`writing_submissions`) — *fire-and-forget upsert trong `handleMarkComplete`: `supabase.auth.getUser()` → upsert {user_id, lesson_id, content, word_count, saved_at}, onConflict: user_id,lesson_id*
- [x] T-10-12 🟢 Full screen writing mode — *fixed overlay `z-50`; mini toolbar (word count + save indicator + exit); ESC thoát; hoạt động trên desktop + mobile*
- [ ] T-10-13 🟢 AI feedback / grammar suggestions
- [ ] T-10-14 🟢 Band score estimation

---

## PHASE 10 — Speaking Practice (FR-07) *(optional MVP)*

- [x] T-11-1 🟡 Trang `/speaking/[id]` — *prompt + vocab hints + model answer (TTS)*
- [x] T-11-2 🟡 Học sinh record câu trả lời và replay — *Recorder component, unlock Mark Complete sau khi record*
- [ ] T-11-3 🟢 AI phân tích phát âm (Azure Speech Assessment) cho Speaking

---

## PHASE 11 — Progress Tracking (FR-08)

- [x] T-12-1 🔴 Trang `/progress` — dashboard học sinh
- [x] T-12-2 🔴 Hiển thị số bài đã hoàn thành (shadowing + dictation)
- [x] T-12-3 🔴 Tổng thời gian luyện tập (phút)
- [x] T-12-4 🔴 Độ chính xác dictation trung bình (%)
- [x] T-12-5 🔴 Current streak — tính từ localStorage, reset nếu bỏ 1 ngày
- [x] T-12-6 🟡 Thông điệp động viên theo streak
- [x] T-12-7 🟡 Current level (hiển thị shadowing vs dictation vs speaking count)
- [x] T-12-8 🟡 Chart/calendar hiển thị ngày có luyện tập
- [x] T-12-9 🟡 Bổ sung thống kê Reading — *📖 Reading count card; icon + routing trong Recent Activity*
- [x] T-12-10 🟡 Bổ sung thống kê Writing — *✍️ Writing count card; type breakdown grid mở rộng 2→5 cột; icon + routing đúng*

---

## PHASE 12 — Admin/Teacher Panel (FR-09)

- [x] T-13-1 🔴 Route `/admin` — bảo vệ bằng role teacher/admin
- [x] T-13-2 🔴 Danh sách bài học + tìm kiếm + filter
- [x] T-13-3 🔴 Form tạo bài học Shadowing/Dictation: title, level, topic, type, transcript, chunking, notes
- [ ] T-13-4 🔴 Upload audio normal speed lên Supabase Storage *(Supabase pending)*
- [ ] T-13-5 🔴 Upload audio slow speed lên Supabase Storage *(Supabase pending)*
- [ ] T-13-6 🔴 Upload hình ảnh bài học *(Supabase pending)*
- [x] T-13-7 🔴 Chỉnh sửa / xoá bài học (custom lessons in localStorage)
- [x] T-13-8 🔴 Tổ chức content theo level / topic / unit
- [x] T-13-9 🔴 Form tạo/chỉnh sửa/xoá bài Reading: passage, image, câu hỏi (mixed types) — *`app/admin/tabs/ReadingAdmin.tsx`: metadata form + paragraphs textarea (blank-line sep) + questions JSON editor with validate button; upsert to Supabase reading_lessons*
- [x] T-13-10 🔴 Form tạo/chỉnh sửa/xoá bài Writing: prompt, idea suggestions, vocabulary, sample outline — *`app/admin/tabs/WritingAdmin.tsx`: metadata + prompt + requirements (per-line) + ideas (per-line) + vocab (comma) + structure (intro/body/conclusion); upsert to Supabase writing_lessons*
- [x] T-13-11 🔴 Xem danh sách bài viết của học sinh (Writing submissions) theo lesson — *`app/admin/tabs/SubmissionsAdmin.tsx`: table with student/lesson/words/date; search + lesson filter; modal to read full essay; enriched via profiles + writing_lessons join*
- [x] T-13-12 🟡 Dashboard thống kê học sinh: số bài, thời gian, accuracy, hoạt động — *tab "Student Stats" trong admin: summary cards + bảng per-student + recent activity feed*
- [x] T-13-13 🟡 Bulk import lessons từ file CSV/JSON — *JSON import, preview table, validate, download template*
- [ ] T-13-14 🟢 Teacher comments trên bài Writing của học sinh

---

## PHASE 13 — Content (CR-01, CR-02, CR-03, CR-04)

- [x] T-14-1 🔴 Soạn 10 Shadowing lessons (school / hobbies / family / food / daily routine) — *10 sample lessons created*
- [x] T-14-2 🔴 Ghi âm hoặc tạo TTS audio (normal + slow) — *Azure TTS (en-US-JennyNeural), lưu MP3 lên Supabase Storage, script `npm run generate-audio`*
- [x] T-14-3 🔴 Soạn 10 Dictation lessons (sentence / dialogue / paragraph) — *10 sample lessons created*
- [x] T-14-4 🔴 Ghi âm hoặc tạo TTS audio cho dictation lessons — *Azure TTS, cùng script generate-audio*
- [ ] T-14-5 🟡 Tìm / tạo hình ảnh minh họa cho từng bài — *shadowing + speaking dùng picsum.photos*
- [x] T-14-6 🟡 Soạn 10 Speaking lessons (prompt + exampleAnswer + hints) — *5 Starter + 5 Level 1*
- [x] T-14-7 🟡 Chia chunking cho 10 shadowing lessons — *4 chunks per lesson*
- [x] T-14-8 🔴 Soạn 10 Reading lessons — *10 bài (r1–r10): school, hobbies, family, food, daily routine; mỗi bài 3–5 đoạn + 5–6 câu hỏi (MC + TF/NG + FillBlank + ShortAnswer); dùng picsum.photos cho image*
- [ ] T-14-9 🟡 Tìm / tạo hình ảnh minh họa cho reading lessons — *hiện dùng picsum placeholder*
- [x] T-14-10 🔴 Soạn 20 Writing lessons — *20 đề (w1–w20): 8 Starter + 7 Level 1 + 5 Level 2; taskType: descriptive/opinion/narrative; wordTarget 80→200; mỗi đề có prompt, requirements, ideas, vocabulary, suggestedStructure đầy đủ*

---

## PHASE 14 — Testing & Polish

- [ ] T-15-1 🔴 Test toàn bộ flow: register → login → shadowing → dictation → reading → writing → progress
- [ ] T-15-2 🔴 Test responsive trên mobile
- [ ] T-15-3 🔴 Test audio playback trên các browser (Chrome, Safari, Firefox)
- [ ] T-15-4 🔴 Test MediaRecorder trên iOS Safari (cần polyfill)
- [ ] T-15-5 🔴 Test Reading split-screen trên tablet + tab mode trên mobile
- [ ] T-15-6 🔴 Test Writing auto-save (reload, close tab)
- [ ] T-15-7 🟡 Kiểm tra performance (Lighthouse score > 80)
- [x] T-15-8 🟡 Error handling: audio lỗi, microphone bị từ chối, network lỗi
- [x] T-15-9 🟡 Loading states và skeleton UI

---

## PHASE 15 — Deploy Production

- [x] T-16-1 🔴 Cấu hình environment variables trên Vercel — *NEXT_PUBLIC_SUPABASE_URL + ANON_KEY đã set*
- [x] T-16-2 🔴 Deploy production lên Vercel — https://shadowing-app-eight.vercel.app
- [ ] T-16-3 🔴 Cấu hình custom domain (nếu có)
- [ ] T-16-4 🟡 Cấu hình Supabase connection pooling
- [ ] T-16-5 🟡 Set up monitoring / error tracking (Sentry)

---

## Tổng kết

| Phase | Mô tả | Done | Total | Status |
|---|---|---|---|---|
| 1 | Project Setup + DB Schema | 15 | 17 | 🔴 |
| 2 | Authentication | 6 | 7 | 🔴 |
| 3 | Layout & Navigation | 5 | 5 | ✅ |
| 4 | Home Page | 4 | 4 | ✅ |
| 5 | Lesson List | 9 | 9 | ✅ |
| 6 | Shadowing Lesson | 12 | 12 | ✅ |
| 7 | Dictation Lesson | 11 | 11 | ✅ |
| 8 | Reading Lesson | 16 | 19 | 🔴 |
| 9 | Writing Lesson | 12 | 14 | 🔴 |
| 10 | Speaking Practice | 2 | 3 | 🟡 |
| 11 | Progress Tracking | 10 | 10 | ✅ |
| 12 | Admin / Teacher Panel | 10 | 14 | 🔴 |
| 13 | Content | 8 | 10 | 🔴 |
| 14 | Testing & Polish | 2 | 9 | 🔴 |
| 15 | Deploy Production | 2 | 5 | 🔴 |
| **Tổng** | | **124** | **149** | **83%** |

---

## 🗺️ KẾ HOẠCH THỰC HIỆN TIẾP THEO

> Reading & Writing module + Admin CRUD + Supabase schema đã hoàn thành. Tiếp theo: Testing & Polish.

### ✅ SPRINT A — Data Layer *(DONE)*
- [x] `data/reading-lessons.json` — 10 bài (r1–r10)
- [x] `data/writing-lessons.json` — 20 đề (w1–w20)
- [x] `LessonsContent.tsx` — 5 type filters, routing đầy đủ
- [x] `middleware.ts` — `/reading` + `/writing` protected

### ✅ SPRINT B — Reading Lesson Page *(DONE)*
- [x] Split-screen layout (desktop sticky left + mobile tab)
- [x] 4 question types + Submit All + score
- [x] Highlight + Underline tool với TreeWalker offset
- [x] Font size A+/A-, annotation localStorage
- [x] Mark Complete → progress sync

### ✅ SPRINT C — Writing Lesson Page *(DONE)*
- [x] Split-screen layout (40/60 desktop + mobile tab)
- [x] Prompt card + Requirements + 3 collapsible support panels
- [x] Vocabulary chips click-to-insert tại cursor
- [x] Auto-save debounce + save indicator
- [x] Word count progress bar + full-screen focus mode
- [x] Mark Complete với soft word-target warning

### ✅ SPRINT D — Integration *(DONE)*
- [x] Reading/Writing count cards trong `/progress`
- [x] Routing + icon đúng trong Recent Activity

---

### ✅ SPRINT E — Admin Panel Reading & Writing *(DONE)*

| Task | Kết quả |
|---|---|
| T-13-9 | `app/admin/tabs/ReadingAdmin.tsx` — CRUD full: metadata + paragraphs textarea + questions JSON editor + validate + upsert Supabase |
| T-13-10 | `app/admin/tabs/WritingAdmin.tsx` — CRUD full: metadata + prompt + requirements + ideas + vocab + structure upsert Supabase |
| T-13-11 | `app/admin/tabs/SubmissionsAdmin.tsx` — table với search/filter + modal đọc essay đầy đủ |
| T-02-8/9 | `supabase/migrations/001_reading_writing.sql` — bảng `reading_lessons` (paragraphs + questions JSONB) + RLS |
| T-02-10/11 | `supabase/migrations/001_reading_writing.sql` — bảng `writing_lessons` + `writing_submissions` (UNIQUE user_id+lesson_id) + RLS |
| T-10-11 | `app/writing/[id]/page.tsx` — fire-and-forget upsert khi Mark Complete (`supabase.auth.getUser()` → `writing_submissions`) |

---

### SPRINT F — Testing & Polish (2–3 ngày)

| Task | Mô tả |
|---|---|
| T-15-1 | Full flow test: register → login → shadowing → dictation → reading → writing → progress |
| T-15-2 | Responsive test mobile (iPhone SE, iPad) |
| T-15-3 | Audio playback trên Chrome, Safari, Firefox |
| T-15-4 | MediaRecorder iOS Safari polyfill |
| T-15-5 | Reading split-screen tablet + tab mobile |
| T-15-6 | Writing auto-save (reload, close tab) |
| T-15-7 | Lighthouse score > 80 |

---

### Dependency map
```
✅ Sprint A → ✅ Sprint B → ✅ Sprint C → ✅ Sprint D
                                                  ↓
                          ✅ Sprint E (Admin Reading/Writing CRUD)
                                                  ↓
                                   Sprint F (Testing & Polish)
```
