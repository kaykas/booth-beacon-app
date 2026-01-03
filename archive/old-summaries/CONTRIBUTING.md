# Engineering Standards & Contribution Guide

## Philosophy
**Booth Beacon** is not just a directory; it is a curated archive of analog culture. Our code must reflect the same level of care, durability, and craftsmanship as the machines we document.

## Core Principles

1.  **User Experience First:** We prioritize the user's journey. Loading states, error boundaries, and empty states are not afterthoughts; they are requirements.
2.  **Type Safety:** We use TypeScript strictly. `any` is forbidden unless absolutely necessary and documented.
3.  **Visual Integrity:** We adhere to the "Nightclub/Analog" aesthetic. Do not introduce new colors or fonts outside the design system (`tailwind.config.ts`).
4.  **Performance:** Images must be optimized (WebP/AVIF). Components should be server-rendered (RSC) by default.

## Architecture

### Directory Structure
- `src/app`: Next.js App Router pages.
- `src/components`: React components.
  - `/ui`: Atomic Shadcn/UI primitives.
  - `/booth`: Domain-specific components (Maps, Cards).
- `src/lib`: Business logic and utilities.
- `supabase`: Database migrations and Edge Functions.
- `scripts`: Maintenance and operation scripts.

### State Management
- **Server State:** Use React Server Components (RSC) for initial data fetching.
- **Client State:** Use `useSWR` or `TanStack Query` for client-side updates.
- **Global State:** Minimal. Use URL search params for shareable state (filters, search).

## Development Workflow

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Setup:**
    Copy `.env.example` to `.env.local` and populate keys.

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

4.  **Linting & Formatting:**
    We use ESLint and Prettier. Run `npm run lint` before committing.

## Data & Crawlers

Our data ingestion pipeline is complex. It involves:
1.  **Firecrawl:** For scraping raw HTML/Markdown.
2.  **Claude Opus:** For intelligent extraction of booth data.
3.  **Google Imagen (Nano Banana):** For generating location previews.

**Do not modify `src/lib/imageGeneration.ts` without understanding the API fallback strategy (Imagen -> Placeholder).**

## Git Conventions

- **Feature Branches:** `feature/my-feature`
- **Fix Branches:** `fix/issue-description`
- **Commit Messages:** Conventional Commits (e.g., `feat: add map clustering`, `fix: map popup overflow`).

---
*Maintained by the Booth Beacon Engineering Team*
