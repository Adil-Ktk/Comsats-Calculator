# COMSATS CALCULATOR

**Calculate smarter. Plan better.**

A marks calculator for COMSATS University Wah Campus students. Enter your quiz, assignment, midterm, and final marks and instantly see your weighted grade — no spreadsheets required.

---

## About This Project

Every semester at COMSATS Wah Campus, students face the same problem: figuring out your actual standing is surprisingly hard. Your marks are spread across quizzes, assignments, a midterm, and a final — each carrying a different weight — and the numbers only make sense once you apply the correct formula. Most students either guess, ask a friend, or build a messy spreadsheet that breaks the moment marks don't come out of 10.

**GradePilot was built to fix that.**

I built this for myself as a COMSATS Wah Campus student. I wanted something that just works — open it, type in your marks, and immediately know where you stand and what you need in the final exam to hit your target grade. No app to install, no account to create, no internet required.

Over time it grew into a proper tool:

- It handles **both theory-only and lab subjects** with the correct official split (67% theory, 33% lab)
- It uses **pool calculation** for quizzes and assignments instead of averaging percentages, which is the mathematically correct method when totals differ across assessments
- The **target calculator** works backwards — tell it the grade you want and it tells you the exact raw marks you need in your final exam
- For lab subjects at midterm, it shows you **two separate figures** so you understand the difference between your actual weighted contribution and your normalized progress out of 50
- Everything runs **in the browser with no backend** — your marks never leave your device

If you are a student at COMSATS Wah Campus (or any university using the same 15/10/25/50 theory breakdown), this tool will give you accurate, instant results without any manual calculation.

---

## Features

- **Non-Lab Calculator** — theory-only subjects with fixed COMSATS weightages
- **Lab Calculator** — subjects split into 67% theory and 33% lab
- **Three modes per calculator** — Midterm progress, Final overall result, Target marks
- **Target Calculator** — enter a desired grade and find out exactly what you need in the final exam
- **Calculation History** — last 50 results saved locally in your browser
- **Decimal mark support** — enter marks like 17.5 / 25 without issues
- **Dark SaaS interface** — clean dashboard layout, works on desktop and mobile

---

## Marking Scheme

These are the fixed COMSATS Wah Campus weights this calculator uses.

### Theory component

| Assessment   | Weight |
|--------------|--------|
| Quizzes      | 15%    |
| Assignments  | 10%    |
| Midterm      | 25%    |
| Final Exam   | 50%    |

### Lab subjects

- Theory = **67%** of total subject marks
- Lab = **33%** of total subject marks
- Lab marks are pooled: `sum(obtained) ÷ sum(total) × 100`

### Grade scale

| Grade | Minimum % |
|-------|-----------|
| A     | 85        |
| B+    | 80        |
| B     | 75        |
| C+    | 70        |
| C     | 65        |
| D+    | 60        |
| D     | 55        |
| F     | < 55      |

---

## Usage

No installation or build step needed. Open `index.html` directly in any modern browser.

```bash
git clone https://github.com/YOUR_USERNAME/gradepilot.git
cd gradepilot
# open index.html in your browser
```

Or just download the ZIP and open `index.html`.

---

## Project Structure

```text
gradepilot/
├── index.html   # App layout and all calculator forms
├── style.css    # Design system and component styles
├── script.js    # Calculation logic and navigation
└── README.md
```

The entire app is vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies, no build tools.

---

## How the calculations work

### Quiz and assignment pooling

Marks are pooled, not averaged:

```text
pool % = sum(all obtained) / sum(all totals) × 100
```

Example: Quiz 1 → 4/5, Quiz 2 → 8/10

- Pool: 12/15 × 100 = **80%** ✓
- Average of percentages: (80% + 80%) / 2 = 80% — same here, but differs when totals vary

### Midterm result (out of 50)

```text
marks = quiz_contrib + assign_contrib + mid_contrib
      = (quiz_pool% × 0.15) + (assign_pool% × 0.10) + (mid_obt/mid_total × 25)
```

### Final result (out of 100)

Same as above plus:

```text
final_contrib = final_obt / final_total × 50
total = quiz + assign + mid + final   (out of 100)
```

### Lab midterm — two figures shown

| Figure          | What it means                                                                    |
|-----------------|----------------------------------------------------------------------------------|
| Actual earned   | Real contribution toward the subject: `(theory/100 × 67) + (lab_pool%/100 × 33)` |
| Normalized / 50 | Progress scaled to 50 so it's comparable to a non-lab midterm                    |

### Target calculator

```text
required_final_contribution = target - current_marks   (on 0–50 scale)
required_final_raw = required_final_contribution / 50 × final_total_marks
```

---

## Browser support

Works in any modern browser (Chrome, Firefox, Edge, Safari). Calculation history is stored in `localStorage` and stays between sessions.

---

## License

MIT — free to use, modify, and share.
