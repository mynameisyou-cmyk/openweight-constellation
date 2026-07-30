import { access, copyFile, mkdir, rename, writeFile } from "node:fs/promises";

await access("dist/server/index.js");
await access("dist/server/prerendered-routes/index.html");
await copyFile(
  "dist/server/prerendered-routes/index.html",
  "dist/client/index.html",
);
await rename("dist/server/index.js", "dist/server/vinext.js");
await writeFile(
  "dist/server/index.js",
  `import app from "./vinext.js";

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === "/" &&
      env?.ASSETS
    ) {
      url.pathname = "/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    return app(request, context);
  },
};
`,
);
await mkdir("dist/.openai", { recursive: true });
await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");

process.stdout.write("Sites worker bundle and static root staged in dist/\n");

