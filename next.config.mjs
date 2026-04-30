/**
 * BEGINNER NOTES
 * File: next.config.mjs
 * Purpose: Project build/tool configuration.
 * Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
 * Why this exists: Keeps related logic/UI in one place so the app stays maintainable.
 */

const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
