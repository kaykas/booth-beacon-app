# Booth Beacon 📸

> The world's definitive analog photo booth discovery platform.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

Booth Beacon connects enthusiasts with authentic analog photo booths worldwide. It combines modern web technology with a deep appreciation for chemical photography.

## 🚀 Quick Start

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/yourusername/booth-beacon-app.git
    cd booth-beacon-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    ```bash
    cp .env.example .env.local
    # Edit .env.local with your Supabase, Google, and Anthropic keys
    ```

4.  **Run the app:**
    ```bash
    npm run dev
    ```

## 🛠️ Tech Stack

-   **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
-   **UI Library:** [Shadcn/UI](https://ui.shadcn.com/)
-   **Database:** [Supabase](https://supabase.com/) (PostgreSQL + PostGIS)
-   **Maps:** Google Maps JavaScript API
-   **AI:** Anthropic Claude (Extraction), Google Imagen (Image Generation)

## 📂 Project Structure

-   `src/app`: Application routes and pages.
-   `src/components`: Reusable UI components.
-   `src/lib`: Utilities, hooks, and API clients.
-   `supabase`: Database schema and Edge Functions.
-   `scripts`: Maintenance and crawler scripts.
-   `docs`: Detailed architectural and operational documentation.

## 📖 Documentation

### Quick Start
-   **[Quick Start Guide](docs/QUICK_START.md)** - 10-minute onboarding for new sessions
-   **[Project Overview](docs/PROJECT_README.md)** - Comprehensive project guide
-   **[Latest Status](docs/SESSION-SUMMARY.md)** - Current session summary

### Technical Docs
-   [Architecture](docs/ARCHITECTURE.md) - System architecture & error handling
-   [Crawler Strategy](docs/MASTER_CRAWLER_STRATEGY.md) - Web crawler system
-   [Documentation Index](docs/INDEX.md) - Complete documentation catalog

### Planning
-   [Master TODO List](docs/MASTER_TODO_LIST.md) - Complete roadmap
-   [Product Requirements](PRD.md) - Full PRD (1256 lines)

## 🤖 Crawlers & Data

We use a robust crawling system to find booths. To run the local crawler:

```bash
npx tsx scripts/robust-crawler.ts
```

For more details, see [docs/CRAWLER_FIX_INSTRUCTIONS.md](docs/CRAWLER_FIX_INSTRUCTIONS.md).

---

**Booth Beacon** — *Four frames. No filters. Just you.*