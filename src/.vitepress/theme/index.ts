import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { initPosthog, trackPageview } from "./analytics";
import HeroDownloadDropdown from "./components/HeroDownloadDropdown.vue";
import StatsSection from "./components/StatsSection.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "home-hero-actions-after": () => h(HeroDownloadDropdown),
      "home-features-after": () => h(StatsSection),
    });
  },
  enhanceApp({ app, router }) {
    app.component("HeroDownloadDropdown", HeroDownloadDropdown);
    app.component("StatsSection", StatsSection);
    initPosthog();
    // 路由切换上报 pageview
    router.onAfterRouteChange = () => {
      trackPageview();
    };
  },
} satisfies Theme;
