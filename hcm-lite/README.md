# HCM Lite — Saylani Hackathon (Beginner Track)

A small HR web app in plain HTML, CSS and JavaScript. No framework, no backend. All data lives in `localStorage`.

## Run it
Open `index.html` (or host the folder on GitHub Pages / Netlify / Vercel). The app starts empty.

## How to use
1. **First run**: create the company and the Admin account on `index.html`.
2. **Settings**: set office start time, grace minutes, yearly leave quota and working days.
3. **Employees**: add an employee. That also creates their login (email + password).
4. **Employee**: log in, check in / check out, apply for leave, see the month calendar.
5. **Admin → Leaves**: approve or reject with a comment. The balance updates.
6. **Payslip**: pick a month, then print or save as PDF.
7. **Smart helper**: the "Ask helper" button on both dashboards. Employees only get their own data.

## Business rules
- Late: check-in after start time + grace. One check-in per day. Check-out only after check-in.
- Under 5 hours worked = half day. A working day with no record (and no approved leave) = absent.
- Leave: working days only, no overlaps, cannot exceed the yearly quota.
- Payslip: per day = salary ÷ working days. Deduction = per day × (absent + 0.5 × half days).

## Files
`index.html`, `pages/*.html`, `css/style.css`, `js/storage.js` (data + rules), `auth.js`, `ui.js`, `employees.js`, `attendance.js`, `leave.js`, `dashboard.js`, `helper.js`.

## Bonus features
- **Camera check-in**: Settings → tick "Require face detection and office location". Employees open the camera (`getUserMedia`), the app checks their location (`navigator.geolocation`) against the office radius, and detects a face with face-api.js (CDN) before check-in is enabled.
- **Charts**: Chart.js (CDN) on the Admin dashboard.
- **Dark mode**: Theme button in the top bar.
- **Export attendance to CSV** and **printable monthly report**: Admin dashboard → Reports.

## Gemini smart helper (bonus)
Admin → Settings → paste a **demo** Gemini API key (from Google AI Studio) and save. The keyword helper answers first; anything it can't answer is sent to Gemini with a short JSON summary of the data (employees only get their own). The key lives in the browser's localStorage only. It is never in the code, so nothing secret is committed to GitHub.
