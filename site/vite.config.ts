import { defineConfig } from 'vite';

// GitHub Pages serves the site under /<repo>/; the workflow sets BASE for that build.
export default defineConfig({ base: process.env.BASE ?? '/' });
