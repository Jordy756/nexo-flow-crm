// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "DM Sans",
      provider: fontProviders.google(),
      cssVariable: "--font-dm-sans",
      weights: [400, 500, 700],
      subsets: ["latin"],
      styles: ["normal"],
      display: "swap",
      formats: ["woff2"],
      fallbacks: ["sans-serif"],
    },
  ],
});
