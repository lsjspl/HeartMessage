import { defineConfig } from "vite";
import uniPlugin from "@dcloudio/vite-plugin-uni";

const uni = ((uniPlugin as { default?: typeof uniPlugin }).default ?? uniPlugin) as typeof uniPlugin;

export default defineConfig({
  plugins: [uni()],
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
