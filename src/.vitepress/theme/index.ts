import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import posthog from "posthog-js";
import HeroDownloadDropdown from "./components/HeroDownloadDropdown.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "home-hero-actions-after": () => h(HeroDownloadDropdown),
    });
  },
  enhanceApp({ app, router }) {
    app.component("HeroDownloadDropdown", HeroDownloadDropdown);
    if (import.meta.env.PROD && !import.meta.env.SSR) {
      posthog.init(import.meta.env.VITE_POSTHOG_KEY);
      // 路由切换上报pageview
      router.onAfterRouteChange = () => {
        posthog.capture("$pageview");
      };
    }
  },
} satisfies Theme;
