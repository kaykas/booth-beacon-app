# Distinguished Engineer Audit & Cleanup Report

## 🧹 Codebase Cleanup
- **Root Directory:** Consolidated 15+ loose scripts into `scripts/maintenance/`.
- **Documentation:** Centralized all documentation into `docs/` and created a new `CONTRIBUTING.md` engineering handbook.
- **Dependencies:** Removed reliance on deprecated APIs (Unsplash Source).

## 🛠️ Robust Crawler Implementation
- **New Script:** `scripts/robust-crawler.ts`
- **Why:** The previous Edge Function crawler was timing out. The new local script runs indefinitely, uses enhanced error handling, and correctly uses the Claude Opus API for extraction.
- **Usage:** `npx tsx scripts/robust-crawler.ts`

## 🎨 User Experience (UX) Enhancements
- **Map Popups:** Redesigned `BoothMap` InfoWindows to be compact (260px width), removing the need for scrolling.
- **AI Images:** Fixed `src/lib/imageGeneration.ts` to strictly use Google Imagen (Nano Banana) or a local fallback, removing the broken Unsplash integration.
- **Error Handling:** Added `not-found.tsx`, `error.tsx`, and `global-error.tsx` for a polished "Nightclub/Analog" brand experience even during failures.
- **Loading States:** Verified `loading.tsx` provides proper skeletons.

## 🚀 Next Steps
1.  **Run the Crawler:** Populate your database with high-quality data.
    ```bash
    npx tsx scripts/robust-crawler.ts
    ```
2.  **Verify Frontend:** Visit `localhost:3000/map` to see the new popups and data.
