import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    // JSXをJSに自動で変換する際の設定(viteの機能)
    jsxFactory: "MyReact.createElement",
  },
});
