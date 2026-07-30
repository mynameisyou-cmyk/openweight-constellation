import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const chromePath =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = Number(process.env.CHROME_DEBUG_PORT ?? 9471);
const profile = await mkdtemp(join(tmpdir(), "constellation-chrome-"));
const artifactDir = new URL("../.artifacts/", import.meta.url);
const exceptions = [];
const requests = [];
let chrome;
let socket;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function retry(operation, attempts = 70) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await wait(120);
    }
  }
  throw lastError;
}

for (const route of ["/", "/privacy", "/terms", "/mcp", "/constellation-protocol.json"]) {
  const response = await fetch(new URL(route, appUrl));
  assert.equal(response.status, 200, `${route} should return 200`);
  assert.ok((await response.arrayBuffer()).byteLength > 100, `${route} should be nonempty`);
}

try {
  chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-domain-reliability",
      "--disable-features=OptimizationHints,MediaRouter",
      "--disable-sync",
      "--hide-scrollbars",
      "--metrics-recording-only",
      "--no-first-run",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      "--window-size=1440,1050",
      appUrl,
    ],
    { stdio: "ignore" },
  );

  const target = await retry(async () => {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const targets = await response.json();
    const page = targets.find((item) => item.type === "page");
    if (!page) throw new Error("No browser page target");
    return page;
  });

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let commandId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") {
      exceptions.push(message.params.exceptionDetails.text);
    }
    if (message.method === "Network.requestWillBeSent") {
      requests.push(message.params.request.url);
    }
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  const command = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++commandId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const response = await command("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.text);
    }
    return response.result.value;
  };

  await command("Runtime.enable");
  await command("Network.enable");
  await retry(async () => {
    const state = await evaluate(`document.readyState`);
    if (state !== "complete") throw new Error(`document state: ${state}`);
    const cards = await evaluate(`document.querySelectorAll(".world-card").length`);
    if (cards !== 4) throw new Error(`world cards: ${cards}`);
    return true;
  });

  const desktop = await evaluate(`(() => ({
    title: document.title,
    cards: document.querySelectorAll(".world-card").length,
    sliders: document.querySelectorAll("input[type=range]").length,
    tools: document.querySelectorAll(".tool-list span").length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    worldLinks: [...document.querySelectorAll(".world-card > a")].map((link) => link.href),
    localStorage: localStorage.length,
    sessionStorage: sessionStorage.length,
    cookies: document.cookie,
  }))()`);

  assert.match(desktop.title, /Openweight Constellation/);
  assert.equal(desktop.cards, 4);
  assert.equal(desktop.sliders, 5);
  assert.equal(desktop.tools, 3);
  assert.ok(desktop.overflow <= 1, `desktop overflow: ${desktop.overflow}`);
  assert.equal(desktop.localStorage, 0);
  assert.equal(desktop.sessionStorage, 0);
  assert.equal(desktop.cookies, "");
  assert.equal(new Set(desktop.worldLinks).size, 4);

  const beforeJoke = await evaluate(`document.querySelector(".pause-panel blockquote").textContent`);
  await evaluate(`(() => {
    const button = [...document.querySelectorAll("button")]
      .find((item) => item.textContent.includes("Rotate joke"));
    button.click();
  })()`);
  const afterJoke = await evaluate(`document.querySelector(".pause-panel blockquote").textContent`);
  assert.notEqual(afterJoke, beforeJoke);

  await evaluate(`(() => {
    const button = [...document.querySelectorAll("button")]
      .find((item) => item.textContent.includes("Begin 36 seconds"));
    button.click();
  })()`);
  assert.equal(
    await evaluate(`document.documentElement.dataset.humanPause`),
    "true",
  );

  await evaluate(`(() => {
    const input = document.querySelector('[data-virtue="honesty"]');
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(input, "0");
    input.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await wait(120);
  assert.match(
    await evaluate(`document.querySelector(".state").textContent`),
    /REPAIR|TENDING/,
  );

  await command("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await wait(120);
  const mobileOverflow = await evaluate(
    `document.documentElement.scrollWidth - document.documentElement.clientWidth`,
  );
  assert.ok(mobileOverflow <= 1, `mobile overflow: ${mobileOverflow}`);

  await command("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await mkdir(artifactDir, { recursive: true });
  const screenshot = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(
    new URL("constellation-desktop.png", artifactDir),
    Buffer.from(screenshot.data, "base64"),
  );

  const appOrigin = new URL(appUrl).origin;
  const remoteRequests = requests.filter((requestUrl) => {
    if (requestUrl.startsWith("data:") || requestUrl.startsWith("blob:")) return false;
    return new URL(requestUrl).origin !== appOrigin;
  });

  assert.deepEqual(remoteRequests, []);
  assert.deepEqual(exceptions, []);

  process.stdout.write(
    `${JSON.stringify(
      {
        appUrl,
        cards: desktop.cards,
        sliders: desktop.sliders,
        tools: desktop.tools,
        desktopOverflow: desktop.overflow,
        mobileOverflow,
        runtimeExceptions: exceptions.length,
        remoteRequests: remoteRequests.length,
        browserStorage: 0,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  if (chrome && !chrome.killed) chrome.kill("SIGTERM");
  await rm(profile, { recursive: true, force: true });
}

