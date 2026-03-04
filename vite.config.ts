import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react({ jsxRuntime: "classic" }),
    dts({
      insertTypesEntry: true,
      include: ["src"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "SearchKit",
      formats: ["es", "cjs", "umd"],
      fileName: (format) => {
        if (format === "es") return "searchkit.esm.js";
        if (format === "cjs") return "searchkit.cjs.js";
        return "searchkit.umd.js";
      },
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: [
        {
          format: "es",
          entryFileNames: "searchkit.esm.js",
          exports: "named",
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
          },
        },
        {
          format: "cjs",
          entryFileNames: "searchkit.cjs.js",
          exports: "named",
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
          },
        },
        {
          format: "umd",
          name: "SearchKit",
          entryFileNames: "searchkit.umd.js",
          exports: "named",
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
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
