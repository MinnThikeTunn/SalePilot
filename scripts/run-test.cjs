require("dotenv").config();
const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

if (typeof global.localStorage === "undefined") {
  const mem = {};
  global.localStorage = {
    getItem: (k) => mem[k] || null,
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
    clear: () => { Object.keys(mem).forEach(k => delete mem[k]); },
  };
}

const testFile = process.argv[2] || "scripts/test-cod-stock-deduction.ts";
const outDir = path.resolve(__dirname, "../node_modules/.cache_test");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outFile = path.join(outDir, "bundle.cjs");

try {
  esbuild.buildSync({
    entryPoints: [path.resolve(process.cwd(), testFile)],
    bundle: true,
    platform: "node",
    target: "node20",
    outfile: outFile,
    format: "cjs",
    define: {
      "import.meta.env": JSON.stringify({
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "https://example.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "dummy-key",
      }),
    },
    loader: { ".json": "json" },
    external: ["@google/genai", "@supabase/supabase-js"],
  });

  require(outFile);
} catch (err) {
  console.error(err);
  process.exit(1);
}
