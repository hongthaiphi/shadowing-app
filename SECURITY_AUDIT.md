# Security Audit Report — ShadowSpeak (shadowing-app)

**Date:** 2026-05-23  
**Scope:** Toàn bộ mã nguồn Next.js (app/, lib/, components/, middleware.ts, scripts/)  
**Severity Levels:** Critical / High / Medium / Low

---

## CRITICAL

### 1. Service Role Key lưu trong `.env.local` — rủi ro lộ toàn bộ database

**File:** `.env.local:8-9`

`SUPABASE_SERVICE_ROLE_KEY` đang được lưu cùng file `.env.local` với các biến môi trường client-side (`NEXT_PUBLIC_*`). Key này có quyền admin toàn bộ database, bỏ qua Row Level Security (RLS). Comment trong file nói "never expose to client" nhưng việc lưu chung một file làm tăng nguy cơ lộ key do:

- Developer vô tình copy-paste cả file
- File bị đọc bởi script khác hoặc log
- Nếu `.gitignore` bị sai/sót, key bị commit lên git

Script `scripts/generate-audio.ts` dùng key này trực tiếp. Key cũng không được xoay vòng (rotation).

**Khuyến nghị:** Chuyển `SUPABASE_SERVICE_ROLE_KEY` ra file `.env` riêng (không có prefix `NEXT_PUBLIC_`), KHÔNG lưu chung với `.env.local`. Đảm bảo file này nằm trong `.gitignore`. Thiết lập rotation định kỳ.

---

### 2. Azure Speech Key lộ trong source code

**File:** `.env.local:5-6`

`AZURE_SPEECH_KEY` là key production của Azure Speech Service, được lưu trong `.env.local`. Nếu key này bị lộ, attacker có thể gọi Azure Speech API gây tốn chi phí lớn. Key được dùng trong API route `/api/assess` và script `generate-audio.ts`.

**Khuyến nghị:** Xác nhận `.env.local` đã có trong `.gitignore` (hiện tại đã có pattern `.env*.local` nhưng cần kiểm tra file có bị track không). Sử dụng Azure Key Vault hoặc biến môi trường trên nền tảng deploy (Vercel).

---

## HIGH

### 3. Không rate limiting trên API endpoint `/api/assess`

**File:** `app/api/assess/route.ts`

Endpoint `/api/assess` gọi Azure Speech API tốn phí mỗi request. Hiện không có bất kỳ rate limiting nào. Attacker có thể:

- Đăng ký tài khoản miễn phí (public registration)
- Gửi hàng nghìn request với audio giả
- Gây cạn kiệt Azure credit / chi phí khổng lồ

Endpoint có check auth (`supabase.auth.getUser()`) nhưng không giới hạn số lần gọi.

**Khuyến nghị:** Thêm rate limiting (VD: 30 request/phút/user). Dùng Upstash Redis + `@upstash/ratelimit` hoặc Vercel KV. Cân nhắc thêm credit system hoặc hard limit per user per day.

---

### 4. Không chống brute force đăng nhập

**File:** `app/login/page.tsx`, `lib/auth.ts:38-58`

Trang login không có bất kỳ cơ chế chống brute force nào:
- Không CAPTCHA / turnstile
- Không rate limiting trên endpoint login
- Không account lockout sau N lần thất bại
- Không delay tăng dần (exponential backoff)

Attacker có thể thử hàng nghìn password để đoán mật khẩu người dùng.

**Khuy nghị:** Thêm rate limiting phía server (Supabase Auth đã có một số protection nhưng nên bổ sung). Thêm Turnstile/CAPTCHA. Implement account lockout sau 5-10 lần thất bại.

---

### 5. Lộ thông tin user qua error message (User Enumeration)

**File:** `app/login/page.tsx:47-54`

Error message phân biệt rõ hai trường hợp:
- `"Invalid login credentials"` — email không tồn tại hoặc sai mật khẩu
- `"Email not confirmed"` — email tồn tại nhưng chưa xác nhận

Attacker có thể dùng thông tin này để enumerate danh sách email đã đăng ký trong hệ thống.

**Khuyến nghị:** Trả về thông báo lỗi giống nhau cho mọi trường hợp: "Email hoặc mật khẩu không chính xác." Không phân biệt giữa email không tồn tại, sai mật khẩu, hay chưa confirm.

---

### 6. Password policy quá yếu

**File:** `app/register/page.tsx:37-39`

Yêu cầu mật khẩu duy nhất: `password.length < 6`. Không có:
- Yêu cầu chữ hoa / chữ thường
- Yêu cầu số
- Yêu cầu ký tự đặc biệt
- Check password strength
- Check password không phải common password

**Khuyến nghị:** Áp dụng policy tối thiểu: 8+ ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số. Cân nhắc dùng `zxcvbn` để check password strength.

---

### 7. Stored XSS qua dữ liệu lesson import

**File:** `app/admin/page.tsx:400-453`, `app/lessons/LessonsContent.tsx:197-278`

Admin page cho phép import JSON lesson từ file hoặc paste. Dữ liệu sau khi import được lưu vào `localStorage` và render trực tiếp ra UI mà không sanitize:

- `{lesson.title}` — render trong `<h3>`, `<span>`
- `{lesson.transcript}` — render trong `<p>`

Nếu attacker import JSON chứa `<script>alert(1)</script>` trong title hoặc transcript, khi admin hoặc user khác (nếu shared localStorage) mở trang lessons, script sẽ chạy.

**Khuyến nghị:** Sanitize tất cả dữ liệu người dùng trước khi render. Dùng `DOMPurify` hoặc React's built-in JSX escaping (hiện tại đang dùng JSX `{}` nên HTML trong string được escape, NHƯNG: nếu dữ liệu được dùng trong `dangerouslySetInnerHTML` hoặc attribute injection thì vẫn nguy hiểm). Kiểm tra lại tất cả các nơi render dữ liệu từ localStorage/Supabase.

Thực tế: React JSX `{variable}` đã escape HTML. Nhưng vẫn nên validate input và không tin tưởng dữ liệu từ localStorage.

---

### 8. Thiếu Content Security Policy (CSP)

**File:** `next.config.mjs`, `middleware.ts`

Không có CSP header nào được cấu hình. Đây là lớp phòng thủ chính chống XSS và data injection. Thiếu CSP nghĩa là nếu có bất kỳ lỗ hổng XSS nào, attacker có thể chạy script không bị hạn chế.

**Khuyến nghị:** Thêm CSP header trong `next.config.mjs`:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.microsoft.com; media-src 'self' https://*.supabase.co blob:;
```

---

### 9. Thiếu security headers cơ bản

**File:** `next.config.mjs`

Thiếu các HTTP security headers quan trọng:
- **Strict-Transport-Security** (HSTS): Không enforce HTTPS
- **X-Content-Type-Options**: Không chặn MIME sniffing
- **X-Frame-Options**: Cho phép iframe nhúng (clickjacking)
- **Referrer-Policy**: Rò rỉ thông tin referrer
- **Permissions-Policy**: Không giới hạn quyền trình duyệt

**Khuyến nghị:** Thêm trong `next.config.mjs` headers:
```js
headers: async () => [
  { source: '/(.*)', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ]}
]
```

---

## MEDIUM

### 10. Dữ liệu người dùng lưu trong localStorage (XSS-vulnerable)

**File:** `lib/auth.ts:11-13`, `lib/progress.ts:9-25`

User data (email, role, name) và toàn bộ progress được lưu trong `localStorage`. Nếu có XSS, attacker dễ dàng đọc được:

```js
localStorage.getItem('user')           // → email, role, name
localStorage.getItem('shadowspeak_progress') // → toàn bộ lịch sử học
```

Đặc biệt, progress còn chứa email patterns (qua `lesson_id`) và thời gian học.

**Khuyến nghị:** Cân nhắc dùng httpOnly cookies cho session data thay vì localStorage. Nếu buộc phải dùng localStorage, encrypt dữ liệu nhạy cảm và thêm CSP để giảm thiểu rủi ro XSS.

---

### 11. Không CSRF protection trên API routes

**File:** `app/api/assess/route.ts`

Next.js API routes không tự động có CSRF protection (chỉ Server Actions mới có). Endpoint `/api/assess` chấp nhận POST request với FormData từ bất kỳ origin nào, miễn là có auth cookie. Nếu attacker lừa user đã login click vào link, họ có thể gửi request từ origin khác.

**Khuyến nghị:** Thêm CSRF token check hoặc dùng `SameSite=Strict` cho cookies. Kiểm tra `Origin`/`Referer` header trong API route.

---

### 12. Admin page để teacher xem dữ liệu tất cả học sinh

**File:** `middleware.ts:48-49`, `app/admin/page.tsx`

Middleware cho phép cả `admin` và `teacher` truy cập `/admin`. Teacher có thể xem:
- Danh sách tất cả students (tên, email)
- Lịch sử hoạt động của từng student
- Thống kê chi tiết (accuracy, thời gian học)

Teacher không thay đổi được role (chỉ admin mới có dropdown) — đây là điểm tốt. Tuy nhiên, việc teacher xem được toàn bộ student data là privacy concern.

**Khuyến nghị:** Giới hạn teacher chỉ xem được students họ phụ trách (nếu có quan hệ teacher-student trong DB). Hoặc ẩn email student khỏi teacher view.

---

### 13. Image URL từ external source không validate

**File:** `app/shadowing/[id]/page.tsx:111`, `app/speaking/[id]/page.tsx:102`, `app/lessons/LessonsContent.tsx:215`

Hình ảnh bài học được load trực tiếp từ URL trong JSON data (`lesson.image`). Dùng `<img>` tag không qua Next.js Image optimization. Rủi ro:

- URL có thể trỏ đến server của attacker → CSP report hoặc tracking pixel
- URL không tồn tại → broken image (đã xử lý onError, nhưng là minor UX)
- Nếu JSON data bị compromise, attacker đổi URL thành malicious content

**Khuyến nghị:** Validate image URL pattern trước khi render. Dùng Next.js `<Image>` component với `remotePatterns` đã cấu hình. Whitelist các domain được phép.

---

### 14. Không audit log cho hành động nhạy cảm

Không có logging nào cho các hành động:
- Đăng nhập thất bại / thành công
- Thay đổi mật khẩu
- Admin thay đổi role user
- Import/Export lesson data
- Xóa lesson

Thiếu audit log gây khó khăn trong việc điều tra sự cố bảo mật.

**Khuyến nghị:** Thêm structured logging (JSON) cho các sự kiện bảo mật. Dùng `console.log` với format chuẩn hoặc dịch vụ log aggregation.

---

### 15. Supabase anon key có quyền đọc toàn bộ profiles/progress

**File:** `app/admin/page.tsx:232-237`

Admin page dùng `getSupabase()` (anon key) để query `profiles` và `progress` tables — nghĩa là RLS policies cho phép user với anon key đọc toàn bộ dữ liệu. Điều này cần thiết cho admin page, nhưng cần đảm bảo:

- RLS policy trên `profiles` table giới hạn đúng: chỉ admin/teacher mới đọc được toàn bộ
- User thường KHÔNG đọc được profiles của người khác

Nếu RLS chưa được cấu hình đúng, bất kỳ user nào cũng có thể query toàn bộ profiles qua Supabase client.

**Khuyến nghị:** Kiểm tra RLS policies trong Supabase Dashboard. Đảm bảo `profiles` table có policy: `SELECT` cho phép admin/teacher đọc tất cả, user thường chỉ đọc profile của chính mình.

---

## LOW

### 16. Không giới hạn độ dài input trong form

**File:** `app/admin/page.tsx:1029-1035`, `app/register/page.tsx`

Các form input (title, transcript, name, email) không có max length. Attacker có thể submit data cực lớn gây:
- Tốn localStorage quota
- Tốn Supabase storage/bandwidth
- Slow render UI

**Khuyến nghị:** Thêm `maxLength` attribute hoặc validate phía client + server.

---

### 17. Thiếu SRI (Subresource Integrity)

**File:** `app/layout.tsx`

Không có SRI hash cho external resources. Nếu CDN bị compromise, script độc có thể được inject mà không bị phát hiện.

**Khuyến nghị:** Thêm `integrity` attribute cho external scripts nếu có sử dụng.

---

### 18. Redirect validation đã được implement — good

**File:** `app/login/page.tsx:8-14`

Đây là điểm tích cực: `getRedirectTarget()` kiểm tra redirect bắt đầu bằng `/` và chặn `//` (protocol-relative URLs). Open redirect được xử lý đúng.

---

## Tổng kết

| Severity | Số lượng |
|----------|---------|
| Critical | 2 |
| High     | 7 |
| Medium   | 6 |
| Low      | 3 |

### Ưu tiên hành động

1. **Ngay lập tức:** Xác nhận `.env.local` không bị commit vào git. Xoay vòng `SUPABASE_SERVICE_ROLE_KEY` và `AZURE_SPEECH_KEY` nếu nghi ngờ đã lộ.
2. **Tuần này:** Thêm rate limiting cho `/api/assess`, thêm security headers (CSP, HSTS, etc.), tăng cường password policy.
3. **Tháng này:** Implement audit logging, thêm CSRF protection, review RLS policies.
4. **Liên tục:** Định kỳ review security, cập nhật dependencies, penetration testing.
