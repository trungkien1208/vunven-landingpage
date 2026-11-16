# Vun Vén — snapshot of current landing (vunven.tdk.best)

Pulled 2026-11-15. Original files in `reference/original/` (same paths as on the live site).

## Product
- **Vun Vén**: a Vietnamese family app for iPhone (coming soon). It covers spending, health, emotions and a weekly family review.
- **Mascot: Hun**, a chubby penguin with a heart on its belly. It talks in a warm "mình / nha" voice. Users earn "cá" (fish) as rewards.
- Owner: tdk.best · support: support@tdk.best
- Legal: https://tdk.best/product/vunven/privacy · https://tdk.best/product/vunven/termandcondition
- Tagline: **"Vun vén cho cả nhà"** / meta: "Cùng Hun ghi chi tiêu, chăm sức khỏe và vun vén cho nhà mình mỗi ngày. Sắp có trên iPhone."

## Tech (old)
Vite + React SPA (a single bundle `index-*.js` ~290KB), hosted on Vercel behind Cloudflare. Fonts: Be Vietnam Pro 400–800 (self-hosted TTF).

## Design tokens (old)
| token | light | dark |
|---|---|---|
| bg | `#F6EDE2` (warm cream) | `#1B1613` |
| card | `#FFFFFF` | `#27201C` |
| fill | `#F7EBDD` | `#332A25` |
| separator | `#E9DCCD` | `#3D332D` |
| ink | `#2B211C` | `#FBF4EC` |
| body | `#6B5B50` | `#BCAEA2` |
| primary | `#D7385F` (rose) / pressed `#B92D50` | same, ink `#FF8EA8` |
| band | `#E1F3EA` (mint) | `#1F3A2E` |
| soft-finance / physical / mental / family | `#FBEFD9` / `#DFF1E9` / `#ECE6F7` / `#FDE7EA` | `#3A2C12` / `#123326` / `#2A2340` / `#4A2028` |

Wrap 1180px. Breakpoints 760 / 800 / 1080 / 1100. Light/dark toggle supported.
**Art style**: 3D clay / claymation, pastel sage green + terracotta, Vietnamese setting (bánh mì, teapot, shuttered windows, scooter).

## Section structure + copy
Nav: Thử cùng Hun `#ghe-nha` · Một ngày với Hun `#mot-ngay` · Riêng tư `#rieng-tu` · Hun Plus `#hun-plus` · Hỏi đáp `#hoi-dap` · CTA **Nhận tin ra mắt** (mailto).

1. **Hero**: "Vun vén cho cả nhà." Sub: "Từ chuyện chi tiêu đến sức khỏe, nhà mình cùng chăm chút mỗi ngày. Có Hun bên cạnh, mình vun vén từng chút."
   - Pillars: "Giữ ví **khỏe**, giữ người **khỏe**, giữ lòng **nhẹ**."
   - The hero scene changes art with the time of day (`home-morning/noon/evening/night`), with a Sáng/Trưa/Chiều/Tối switcher. Tapping Hun shows "Hun đây, mừng bạn ghé chơi."
2. **Ghé nhà Hun / Chạm thử Vun Vén** (`#ghe-nha`): an interactive iPhone demo using sample data (nothing is sent). Four modes:
   - Thu chi (enter an amount, pick a category, save → "+10 cá"; budget pacing: Đúng nhịp / Vượt nhịp)
   - Tinh thần (a 7-step mood slider, mood words, what influenced you, private by default)
   - Thể chất (blood sugar / blood pressure / weight / sleep; "không chẩn đoán")
   - Nhìn lại tuần (weekly chart, spending vs last week, plan for next week, "Bốn tuần đồng lòng")
   - Home tabs: Tổ Ấm · Tài chính · Sức khỏe · Gia đình. The Tổ Ấm screen shows "4 việc hôm nay" and "Nhìn nhanh".
3. **Một ngày với Hun** (`#mot-ngay`): a day strip:
   - Sáng: "Sáng nay, lòng mình thấy sao?" → dành chút thời gian nghe lòng mình
   - Trưa: "Trưa rồi, mình ghi lại số đo nha." → ghi số đo, chăm sức khỏe cả nhà
   - Tối: "Hôm nay nhà mình đã chi những gì?" → dán tin ngân hàng để ghi nhanh hơn
   - Chủ nhật: "Mình ngồi lại, xem tuần qua ra sao." → cùng nhìn lại, tính chuyện tuần tới
4. **Ở xa, vẫn chăm ba mẹ**: parents don't need to install the app; you log their readings and Hun reminds them about medication. Chips: Nhắc uống thuốc · Đường huyết, HbA1c · Huyết áp, cân nặng · PDF gửi bác sĩ.
5. **Mời người thương vào nhà**: create a home and invite your partner. Chips: Mã mời hoặc QR · Hồ sơ cho con, ba mẹ · Giỗ, sinh nhật theo âm lịch.
6. **Giữ chuyện nhà mình** (`#rieng-tu`): "Chuyện riêng của bạn, Hun giữ cẩn thận."
   - Góc riêng của bạn (journal and emotions private by default)
   - Bạn chọn dùng AI (online AI is off by default)
   - Không quảng cáo (data is not sold) → Đọc chính sách riêng tư
7. **Hun Plus** (`#hun-plus`): "Một gói, cả nhà cùng dùng. Chưa mở bán nên mọi tính năng vẫn miễn phí."
   - Gói Năm **399.000đ/năm** (≈33.000đ/tháng, 14-day trial) · Gói Tháng **49.000đ/tháng**
   - Perks: Báo cáo tuần, tháng · PDF gửi bác sĩ (3–12 tháng) · Hồ sơ cả nhà · Tự điền chi tiêu từ tin ngân hàng · Lưu kết quả khám 5GB · Không giới hạn ví/mục tiêu
   - Free note: "Ghi chép, nhắc nhở, cảnh báo người nhà vẫn miễn phí." Terms: "Giá dự kiến, có thể đổi khi mở bán…"
8. **Hỏi đáp** (`#hoi-dap`): 7 questions (what to log, linking a bank account, who sees what, logging for parents, what's free, how many plans, whether demo data is saved). Full answers are in the bundle; grep `Mỗi ngày mình cần ghi`.
9. **Footer CTA**: "Sắp có trên iPhone. Bạn để lại lời nhắn, ra mắt tụi mình báo ngay." Closing line: "Mai mình lại chăm chút cho nhà mình."

## Assets downloaded (`reference/original/`, ~9.5MB, 117 files)
- `og.jpg` (1200×630), `favicon.png`, `apple-touch-icon.png` (app icon)
- `art/` (12): home-morning/noon/evening/night, tab-finance/health/mental, sub-meds/privacy/report/review, invite-partner — 1200×600 clay illustrations
- `hun/hun-pose-{3q,side,crouch,jump}.webp`: static poses
- `hun/motion/*.webp`: **animated** webp (~0.5–1MB each) plus a `-still` version: welcome-hero, idle-look, ok-nod, thinking, coins, pill, review, lock-key, night-sleepy
- `demo-icons/`: hun-mood-1..7, 3D icons for category-*, settings-*, control-*, health-*, tab-*-{default,selected}.png, weather-sun/moonstars
- `icons/`: a smaller set of 3D icons (category, settings, card, health, wallet-bank, checkup-general…)
- `demo-fonts/`: Be Vietnam Pro TTF 400/500/600/700/800

## Missing / not found (placeholders when building)
These names are referenced in the code but no file was found at a path I guessed (they may be inline SVGs or at other paths):
`arrow-down/right/up-right`, `circle`, `clock`, `plus` → use inline SVG icons.
`icons/category-{bills,bonus,business,coffee,food,gifts,market,other_income,salary,shopping,star,transit}`, `icons/badge-review_4w`, `icons/notice-success`, `icons/settings-{bell,fishicon,lightbulb}`, `icons/control-*` → the **demo-icons/*-v1.webp** versions exist, so use those.
Not found at all: any app screenshot/App Store badge (the site doesn't have one; the iPhone demo is coded by hand). The new landing will need a placeholder mockup until real assets are available.
