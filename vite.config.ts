import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ["src"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "MixpeekSearch",
      formats: ["es", "cjs", "umd"],
      fileName: (format) => {
        if (format === "es") return "mixpeek-search.esm.js";
        if (format === "cjs") return "mixpeek-search.cjs.js";
        return "mixpeek-search.umd.js";
      },
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: [
        {
          format: "es",
          entryFileNames: "mixpeek-search.esm.js",
          exports: "named",
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
            "react/jsx-runtime": "jsxRuntime",
          },
        },
        {
          format: "cjs",
          entryFileNames: "mixpeek-search.cjs.js",
          exports: "named",
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
            "react/jsx-runtime": "jsxRuntime",
          },
        },
        {
          format: "umd",
          name: "MixpeekSearch",
          entryFileNames: "mixpeek-search.umd.js",
          exports: "named",
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
            "react/jsx-runtime": "jsxRuntime",
          },
        },
      ],
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
