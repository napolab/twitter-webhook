import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  imports: false, // 明示 import に統一 (oxlint フレンドリー)
  manifest: {
    name: "Twitter Webhook",
    permissions: ["storage"],
    host_permissions: ["https://discord.com/*"],
  },
});
