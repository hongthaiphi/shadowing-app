# Requirements — English Shadowing & Dictation Website

## 1. Tổng quan

**Mục tiêu:** Website giúp học sinh Việt Nam luyện tập tiếng Anh tại nhà thông qua 2 phương pháp: **Shadowing** và **Dictation**.

**Đối tượng:** Học sinh lớp 2 → IELTS, đã có nền grammar cơ bản, còn yếu nghe-nói.

---

## 2. Functional Requirements

### FR-01 — Authentication
| ID | Yêu cầu | Mức độ |
|---|---|---|
| FR-01-1 | Đăng ký tài khoản bằng email/password | Must |
| FR-01-2 | Đăng nhập / Đăng xuất | Must |
| FR-01-3 | Phân quyền: Student / Teacher / Admin | Must |
| FR-01-4 | Quên mật khẩu / reset qua email | Should |
| FR-01-5 | Đăng nhập bằng Google (OAuth) | Could |

---

### FR-02 — Trang Home
| ID | Yêu cầu | Mức độ |
|---|---|---|
| FR-02-1 | Hero section: headline + subheadline + CTA "Start Practising" | Must |
| FR-02-2 | 4 Feature cards: Shadowing / Dictation / Speaking / Progress | Must |
| FR-02-3 | Demo preview: audio player + record button + transcript + dictation box | Should |

---

### FR-03 — Shadowing Practice
| ID | Yêu cầu | Mức độ |
|---|---|---|
| FR-03-1 | Danh sách bài học có filter theo level / topic / trạng thái (new/completed) | Must |
| FR-03-2 | Trang bài học hiển thị: tiêu đề, hình ảnh, audio player, transcript | Must |
| FR-03-3 | Audio normal speed + slow speed | Must |
| FR-03-4 | Chunk display: chia câu thành chunk ngắn, luyện từng chunk trước | Must |
| FR-03-5 | Ghi âm giọng học sinh (Record button) | Must |
| FR-03-6 | Replay bản ghi âm của học sinh | Must |
| FR-03-7 | Nút Try Again và Mark Complete | Must |
| FR-03-8 | AI phân tích và chỉ ra các âm sai sau khi ghi âm | Could |

---

### FR-04 — Dictation Practice
| ID | Yêu cầu | Mức độ |
|---|---|---|
| FR-04-1 | Nghe audio và gõ lại nội dung vào text input | Must |
| FR-04-2 | Replay audio, slow speed | Must |
| FR-04-3 | Kiểm tra đáp án: highlight lỗi sai từng từ | Must |
| FR-04-4 | Show full answer sau khi nộp | Must |
| FR-04-5 | Retry: thử lại bài đó | Must |
| FR-04-6 | 3 dạng bài: sentence / dialogue / paragraph | Must |

---

### FR-05 — Reading Practice
| ID | Yêu cầu | Mức độ |
|---|---|---|
| FR-05-1 | Split-screen layout: LEFT 50% hiển thị passage, RIGHT 50% hiển thị câu hỏi | Must |
| FR-05-2 | Left panel: title, image (optional), reading text | Must |
| FR-05-3 | Highlight tool: bôi vàng keyword/sentence trong passage | Must |
| FR-05-4 | Font size adjustment (A+ / A-) để dễ đọc trên tablet/mobile | Must |
| FR-05-5 | Underline tool cho keyword | Should |
| FR-05-6 | Câu hỏi: Multiple Choice (A/B/C/D) | Must |
| FR-05-7 | Câu hỏi: True / False / Not Given | Must |
| FR-05-8 | Câu hỏi: Fill in the Blank | Must |
| FR-05-9 | Câu hỏi: Short Answer (gõ câu trả lời ngắn) | Must |
| FR-05-10 | Mobile: chuyển sang tab mode (tab "Passage" / tab "Questions") thay vì split-screen | Must |
| FR-05-11 | Sticky notes bên cạnh passage | Could |
| FR-05-12 | Timer đếm thời gian làm bài | Could |
| FR-05-13 | Vocabulary popup / dictionary click | Could |

---

### FR-06 — Writing Practice
| ID | Yêu cầu | Mức độ |
|---|---|---|
| FR-06-1 | Hiển thị writing prompt (đề bài, topic, yêu cầu) | Must |
| FR-06-2 | Ideas/Outline support: suggested ideas, vocabulary, sample structure | Must |
| FR-06-3 | Ô viết lớn, clean, distraction-free (giống Google Docs mini) | Must |
| FR-06-4 | Word count hiển thị real-time | Must |
| FR-06-5 | Auto save (reload không mất bài) | Must |
| FR-06-6 | Draft saving: lưu bài để viết tiếp sau | Should |
| FR-06-7 | Full screen writing mode | Could |
| FR-06-8 | AI feedback / grammar suggestions | Could |
| FR-06-9 | Band score estimation | Could |

---

### FR-07 — Speaking Practice *(optional MVP)*
| ID | Yêu cầu | Mức độ |
|---|---|---|
| FR-07-1 | Hiển thị prompt câu hỏi (vd: "Tell me about your best friend") | Should |
| FR-07-2 | Học sinh ghi âm câu trả lời và nghe lại | Should |
| FR-07-3 | AI phát hiện lỗi phát âm (tích hợp Azure Speech) | Could |

---

### FR-08 — Progress Tracking
| ID | Yêu cầu | Mức độ |
|---|---|---|
| FR-08-1 | Hiển thị số bài đã hoàn thành | Must |
| FR-08-2 | Tổng thời gian luyện tập (phút) | Must |
| FR-08-3 | Độ chính xác dictation (%) | Must |
| FR-08-4 | Current streak (chuỗi ngày liên tiếp) | Must |
| FR-08-5 | Current level | Should |
| FR-08-6 | Thông điệp động viên (vd: "Great job! 5 days in a row") | Should |

---

### FR-09 — Teacher/Admin Panel
| ID | Yêu cầu | Mức độ |
|---|---|---|
| FR-09-1 | Tạo/chỉnh sửa/xoá bài học Shadowing/Dictation (title, level, topic, transcript, notes) | Must |
| FR-09-2 | Upload audio 2 phiên bản: normal speed + slow speed | Must |
| FR-09-3 | Upload hình ảnh cho bài học | Must |
| FR-09-4 | Nhập chunking thủ công (chia câu thành các chunk) | Must |
| FR-09-5 | Tổ chức content theo level / topic / unit / story series | Must |
| FR-09-6 | Tạo/chỉnh sửa/xoá bài Reading: passage, image, câu hỏi các dạng | Must |
| FR-09-7 | Tạo/chỉnh sửa/xoá bài Writing: prompt, idea suggestions, vocabulary, sample outline | Must |
| FR-09-8 | Xem bài viết của học sinh (Writing submissions) | Must |
| FR-09-9 | Xem thống kê học sinh: số bài, thời gian, độ chính xác, hoạt động | Should |
| FR-09-10 | Teacher comments trên bài Writing | Could |

---

## 3. Content Requirements

### CR-01 — Shadowing Lessons (MVP: 50 bài)
- Topics: school, hobbies, family, food, daily routine
- 3 loại: Mini Sentences | Story-based (6–10 câu) | Chunk Drills
- Mỗi bài có: hình ảnh, audio, transcript, chunking, context

### CR-02 — Dictation Lessons (MVP: 50 bài)
- Dạng: sentence (dễ) → dialogue (trung bình) → paragraph (khó)
- Mỗi bài có: audio (normal + slow), đáp án

### CR-03 — Reading Lessons (MVP: 20 bài)
- Topics: school, hobbies, family, animals, daily life
- Mỗi bài có: passage, image (optional), câu hỏi (mixed dạng)
- Hỗ trợ highlight và font size adjustment

### CR-04 — Writing Lessons (MVP: 20 đề)
- Topics: describe a person/place/thing, opinion, narrative
- Mỗi đề có: prompt, suggested ideas, suggested vocabulary, sample structure

---

## 4. Non-Functional Requirements

| ID | Yêu cầu | Chi tiết |
|---|---|---|
| NFR-01 | Responsive | Mobile-first, chạy tốt trên điện thoại |
| NFR-02 | Performance | Load trang < 3s, audio load nhanh |
| NFR-03 | Accessibility | Font dễ đọc, nút bấm đủ lớn cho học sinh nhỏ |
| NFR-04 | Navigation | Tối giản, dễ hiểu cho học sinh từ lớp 2 |
| NFR-05 | Audio | Hỗ trợ format MP3/WAV, có fallback |
| NFR-06 | Security | Auth JWT/session, route bảo vệ theo role |

---

## 5. Pages (MVP Scope)

| Trang | Route | Role |
|---|---|---|
| Home | `/` | Public |
| Đăng nhập/Đăng ký | `/login`, `/register` | Public |
| Danh sách bài học | `/lessons` | Student |
| Shadowing lesson | `/shadowing/[id]` | Student |
| Dictation lesson | `/dictation/[id]` | Student |
| Reading lesson | `/reading/[id]` | Student |
| Writing lesson | `/writing/[id]` | Student |
| My Progress | `/progress` | Student |
| Admin Panel | `/admin` | Teacher/Admin |

---

## 6. Tech Stack (đề xuất)

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend/API | Next.js API Routes hoặc separate Express |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Audio storage | Supabase Storage / Cloudinary |
| AI Speech | Azure Speech Service (pronunciation assessment) |
| Deployment | Vercel (frontend) |

---

## 7. Out of Scope (v1)

- Social features (bình luận, chia sẻ)
- Gamification / leaderboard
- Mobile app (iOS/Android)
- Video content
- Live class / real-time
- Payment / subscription
