// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: false,
    outDir: "dist",
    clean: true,
    sourcemap: true,
    target: "es2022",
    external: [
        "react",
        "react-dom",
        "next",
        "@apollo/client",
        "graphql",
        "js-cookie"
    ],
    esbuildOptions: (ctx) => {
        // Si necesitas tweaks extra a esbuild, los pones aquí
        return ctx;
    }
});
