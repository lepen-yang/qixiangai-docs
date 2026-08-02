import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

import HeroDownloadDropdown from "./components/HeroDownloadDropdown.vue";

import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "home-hero-actions-after": () => h(HeroDownloadDropdown),
    });
  },
  enhanceApp({ app }) {
    app.component("HeroDownloadDropdown", HeroDownloadDropdown);
  },
} satisfies Theme;
