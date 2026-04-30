/**
 * BEGINNER NOTES
 * File: postcss.config.mjs
 * Purpose: PostCSS configuration used by Next.js while processing CSS.
 * Data sources: Tailwind CSS PostCSS plugin.
 * Why this exists: Lets Tailwind generate utility CSS from the classes used in the app.
 */

const config = {
  plugins: {
    // Tailwind scans project files and outputs the matching CSS utilities.
    "@tailwindcss/postcss": {},
  },
};

// Next.js reads this config during development/build.
export default config;
