# System Design Mastery — Learning Platform

A complete, static learning platform for mastering **Low-Level Design (LLD)** and **High-Level Design (HLD)** system design interviews. Built with pure HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no backend.

## Features

- **22 weeks of structured content** — 10 LLD + 12 HLD weeks with Concepts, Practice, and Projects
- **36 bonus problems** — 18 LLD + 18 HLD, graded Easy / Medium / Hard
- **Quiz system** — Per-week quizzes with MCQ, multi-select, true/false, scoring, and review
- **Timed exams** — LLD Final, HLD Final, and Full Mock with countdown timer and question grid
- **Interview prep** — DERSC and 6-Step frameworks, checklists, anti-patterns, cheat sheets, random question drill
- **Progress tracking** — Lesson completion, course percentage, study heatmap, streak counter
- **Notes system** — Per-lesson notes with search, edit, and text export
- **Smart revision** — Auto-generated list from bookmarks, difficult flags, and failed quizzes
- **Client-side search** — Search across all lessons and topics
- **Dark mode** — Toggle with persistent preference
- **Fully offline** — All data stored in localStorage, works without internet after first load
- **200+ lesson pages** — Content derived from Python course repositories

## Quick Start (Local)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/system-design-mastery-web.git
cd system-design-mastery-web

# Serve locally (any static server works)
python -m http.server 8080
# OR
npx serve .
# OR
php -S localhost:8080
```

Open **http://localhost:8080** in your browser.

> **Note**: A local server is required because the site uses `fetch()` to load JSON data and HTML content fragments. Opening `index.html` directly via `file://` will not work due to CORS restrictions.

## Deploy to GitHub Pages

### Option 1: Deploy from `main` branch (simplest)

1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: System Design Mastery learning platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/system-design-mastery-web.git
   git push -u origin main
   ```

2. Go to your repository on GitHub.

3. Navigate to **Settings** → **Pages**.

4. Under **Source**, select:
   - **Branch**: `main`
   - **Folder**: `/ (root)`

5. Click **Save**.

6. Wait 1–2 minutes. Your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/system-design-mastery-web/
   ```

### Option 2: Deploy using GitHub Actions

1. Push the project to GitHub (same as step 1 above).

2. Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/configure-pages@v4
         - uses: actions/upload-pages-artifact@v3
           with:
             path: '.'
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

3. Go to **Settings** → **Pages** → **Source**: select **GitHub Actions**.

4. Push the workflow file. The action will auto-deploy on every push to `main`.

### Option 3: Deploy to a custom domain

1. Complete Option 1 or 2 first.

2. In **Settings** → **Pages** → **Custom domain**, enter your domain (e.g., `learn.yourdomain.com`).

3. Add a `CNAME` file to the repository root:
   ```
   learn.yourdomain.com
   ```

4. Configure DNS at your domain registrar:
   - For apex domain: Add `A` records pointing to GitHub's IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - For subdomain: Add a `CNAME` record pointing to `YOUR_USERNAME.github.io`.

5. Enable **Enforce HTTPS** in GitHub Pages settings.

## Project Structure

```
system-design-mastery-web/
├── index.html              # Landing page
├── dashboard.html          # Dashboard with stats, streak, goals
├── course.html             # Course overview (10 LLD / 12 HLD weeks)
├── week.html               # Week detail with Concepts/Practice/Projects tabs
├── lesson.html             # Lesson viewer with code highlighting
├── quiz.html               # Quiz engine (per-week quizzes)
├── exam.html               # Timed exam engine
├── interview.html          # Interview prep hub
├── notes.html              # Notes manager
├── progress.html           # Progress tracker + study heatmap
├── revision.html           # Auto-generated revision list
├── settings.html           # Theme, data export/import, reset
├── search.html             # Client-side search
│
├── css/                    # 8 CSS files (design tokens, layout, components)
├── js/                     # 4 core + 14 modules + 4 utilities
├── data/                   # 7 JSON files (courses, quizzes, exams, interview prep)
└── content/                # 200+ HTML lesson fragments
    ├── lld/                #   10 weeks + 18 bonus
    └── hld/                #   12 weeks + 18 bonus
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styling | CSS3 with custom properties (dark mode via `data-theme`) |
| Logic | Vanilla JavaScript (ES6+, no frameworks) |
| Data | JSON files loaded via `fetch()` |
| Persistence | `localStorage` (progress, notes, bookmarks, settings) |
| Code highlighting | Custom regex-based Python syntax highlighter |
| Deployment | Any static file server / GitHub Pages |

## Data Persistence

All user data is stored in the browser's `localStorage` under the `sdm_` prefix:

| Key | Contents |
|-----|----------|
| `sdm_progress` | Lesson completion status per course/week |
| `sdm_quizResults` | Quiz scores and answers |
| `sdm_examResults` | Exam scores, pass/fail, time used |
| `sdm_notes` | User notes per lesson |
| `sdm_bookmarks` | Bookmarked lesson keys |
| `sdm_difficult` | Lessons flagged as difficult |
| `sdm_studyLog` | Daily study log (date, minutes) |
| `sdm_streak` | Current and longest study streak |
| `sdm_goals` | Daily and weekly study goals |
| `sdm_theme` | Light or dark mode preference |
| `sdm_lastVisited` | Last visited lesson for "Continue Learning" |

Use **Settings → Export** to back up all data as JSON, and **Settings → Import** to restore.

## Course Content

### LLD Course (10 Weeks)

| Week | Topic | Lessons |
|------|-------|---------|
| 1 | SOLID Principles | SRP, OCP, LSP, ISP, DIP, Combined Refactoring |
| 2 | Structural Patterns | Adapter, Facade, Proxy, Composite, Flyweight |
| 3 | Behavioral Patterns Part 1 | State, Command, Chain of Responsibility, Template Method, Mediator |
| 4 | Behavioral Patterns Part 2 | Iterator, Null Object, Memento, Visitor, Combining Patterns |
| 5 | UML & LLD Methodology | Class Diagrams, Relationships, 6-Step Framework |
| 6 | Game & Board Problems | Tic-Tac-Toe, Snake & Ladder, Chess |
| 7 | Real-World Systems | Parking Lot, Elevator, Vending Machine |
| 8 | Platform Systems | Splitwise, BookMyShow, Hotel Booking |
| 9 | Infrastructure Systems | LRU Cache, Rate Limiter, Logging, Pub/Sub |
| 10 | Advanced & Mock Interviews | Food Delivery, ATM, Anti-Patterns, Time Management |

### HLD Course (12 Weeks)

| Week | Topic | Lessons |
|------|-------|---------|
| 1 | Fundamentals & Framework | HLD vs LLD, Scalability, Estimation, CAP, DERSC |
| 2 | Networking & Protocols | DNS, CDN, Load Balancers, REST/gRPC, WebSockets |
| 3 | Databases Deep Dive | SQL vs NoSQL, Indexing, Replication, Sharding, ACID/BASE |
| 4 | Caching & Performance | Strategies, Invalidation, Redis, CDN, Consistent Hashing |
| 5 | Message Queues & Async | Kafka/RabbitMQ, Event-Driven, Streaming, Idempotency |
| 6 | Microservices | Monolith vs Micro, Saga, Circuit Breaker, Raft/Paxos |
| 7 | Storage & Data Pipeline | S3, Data Lakes, ETL, Elasticsearch, Time-Series |
| 8 | Core Internet Problems | URL Shortener, Pastebin, Rate Limiter |
| 9 | Social & Messaging | Twitter Feed, WhatsApp, Notifications, Instagram |
| 10 | Media & Streaming | YouTube, Netflix, Spotify, Google Drive |
| 11 | Commerce & Platforms | Amazon, Uber, Zomato, Airbnb |
| 12 | Infra & Advanced | Web Crawler, KV Store, Ticketmaster, Payments |

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+

## License

This project is for personal educational use.
