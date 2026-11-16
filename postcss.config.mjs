// Tailwind CSS v4 through PostCSS — the only plugin the generated site's
// build needs. Next 16 picks this config up automatically, and the
// OpenNext/Cloudflare deploy runs the same `next build`, so the pipeline is
// identical from local dev to the Workers artifact.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
