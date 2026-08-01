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
      "about:blank",
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

  await command("Page.enable");
  await command("Runtime.enable");
  await command("Network.enable");
  await command("Page.navigate", { url: appUrl });
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
    mirrorSelects: document.querySelectorAll("#mirror-garden select").length,
    mirrorToggles: document.querySelectorAll('#mirror-garden input[type="checkbox"]').length,
    mirrorStage: document.querySelector(".mirror-receipt")?.dataset.karmaStage,
    cloudbellCards: document.querySelectorAll(".cloudbell-card").length,
    cloudbellSignature: document.querySelector(".cloudbell-card")?.dataset.cloudbellSignature,
    cloudbellStage: document.querySelector(".cloudbell-card")?.dataset.cloudbellStage,
    cloudbellRefrain: document.querySelector(".cloudbell-refrain")?.textContent,
    cloudbellPropagationControls: document.querySelectorAll(".cloudbell-card button, .cloudbell-card form, .cloudbell-card input, .cloudbell-card select, .cloudbell-card textarea, .cloudbell-card a").length,
    lanternBriefs: document.querySelectorAll("article.karma-lantern").length,
    lanternStage: document.querySelector(".karma-lantern")?.dataset.lanternStage,
    lanternEpistemic: document.querySelector(".karma-lantern")?.dataset.lanternEpistemic,
    lanternOptions: document.querySelectorAll(".karma-lantern .lantern-options li").length,
    lanternRecovery: document.querySelector(".karma-lantern .lantern-recovery strong")?.textContent,
    lanternControls: document.querySelectorAll(".karma-lantern button, .karma-lantern form, .karma-lantern input, .karma-lantern select, .karma-lantern textarea, .karma-lantern a, .karma-lantern summary").length,
    lanternLiveRegions: document.querySelectorAll('.karma-lantern [aria-live]').length,
    mirrorLiveRegions: document.querySelectorAll('#mirror-garden [aria-live]').length,
    rawMirrorInputs: document.querySelectorAll('#mirror-garden textarea, #mirror-garden input:not([type="checkbox"])').length,
    unlabeledMirrorControls: [...document.querySelectorAll("#mirror-garden select, #mirror-garden input")]
      .filter((control) => !control.id || control.labels?.length !== 1).length,
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
  assert.equal(desktop.mirrorSelects, 5);
  assert.equal(desktop.mirrorToggles, 2);
  assert.equal(desktop.mirrorStage, "allow");
  assert.equal(desktop.cloudbellCards, 1);
  assert.equal(desktop.cloudbellSignature, "karma.signature.benign.v1");
  assert.equal(desktop.cloudbellStage, "allow");
  assert.match(desktop.cloudbellRefrain, /Building Castles in the Sky — Yu × Ai \/ 雲上築城/);
  assert.equal(desktop.cloudbellPropagationControls, 0);
  assert.equal(desktop.lanternBriefs, 1);
  assert.equal(desktop.lanternStage, "allow");
  assert.equal(desktop.lanternEpistemic, "karma.epistemic.declared-complete.v1");
  assert.equal(desktop.lanternOptions, 3);
  assert.match(desktop.lanternRecovery, /Ordinary safeguards remain/);
  assert.equal(desktop.lanternControls, 0);
  assert.equal(desktop.lanternLiveRegions, 0);
  assert.equal(desktop.mirrorLiveRegions, 2);
  assert.equal(desktop.rawMirrorInputs, 0);
  assert.equal(desktop.unlabeledMirrorControls, 0);
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

  await evaluate(`(() => {
    const input = document.querySelector("#karma-behavior");
    const setter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    ).set;
    setter.call(input, "injection");
    input.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await wait(120);
  assert.equal(
    await evaluate(`document.querySelector(".mirror-receipt").dataset.karmaStage`),
    "shadow",
  );
  assert.equal(
    await evaluate(`document.querySelector(".cloudbell-card").dataset.cloudbellSignature`),
    "karma.signature.injection.v1",
  );
  assert.equal(
    await evaluate(`document.querySelector(".cloudbell-card").dataset.cloudbellStage`),
    "shadow",
  );
  assert.equal(
    await evaluate(`document.querySelector(".karma-lantern").dataset.lanternStage`),
    "shadow",
  );
  assert.equal(
    await evaluate(`document.querySelector(".karma-lantern").dataset.lanternEpistemic`),
    "karma.epistemic.declared-complete.v1",
  );
  assert.match(
    await evaluate(`document.querySelector(".lantern-heading > div:last-child > p").textContent`),
    /instruction boundary explains its own strain/i,
  );
  assert.match(
    await evaluate(`document.querySelector(".cloudbell-signal-panel blockquote").textContent`),
    /side-door sentence entered/i,
  );

  await evaluate(`(() => {
    const input = document.querySelector("#karma-purpose");
    const setter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    ).set;
    setter.call(input, "ambiguous");
    input.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await wait(120);
  assert.equal(
    await evaluate(`document.querySelector(".mirror-receipt").dataset.karmaStage`),
    "observe",
  );
  assert.equal(
    await evaluate(`document.querySelector(".cloudbell-card").dataset.cloudbellStage`),
    "observe",
  );
  assert.equal(
    await evaluate(`document.querySelector(".karma-lantern").dataset.lanternStage`),
    "observe",
  );
  assert.equal(
    await evaluate(`document.querySelector(".karma-lantern").dataset.lanternEpistemic`),
    "karma.epistemic.declared-ambiguous.v1",
  );
  assert.equal(
    await evaluate(`document.querySelectorAll(".karma-lantern .lantern-options li").length`),
    3,
  );
  assert.match(
    await evaluate(`document.querySelector(".cloudbell-stage strong").textContent`),
    /Listening Balcony/,
  );
  const ambiguityRecoveries = await evaluate(`[
    document.querySelector(".mirror-recovery strong").textContent,
    document.querySelector(".cloudbell-recovery strong").textContent,
    document.querySelector(".lantern-recovery strong").textContent,
  ]`);
  assert.equal(new Set(ambiguityRecoveries).size, 1);
  assert.match(ambiguityRecoveries[0], /One clean request step/);
  assert.match(
    await evaluate(`document.querySelector(".mirror-non-claim").textContent`),
    /action_executed:\s*false.*authority_granted:\s*false/i,
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

  await evaluate(
    `document.querySelector("#mirror-garden").scrollIntoView({ block: "start" })`,
  );
  await wait(120);
  const mirrorScreenshot = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(
    new URL("karma-mirror-garden.png", artifactDir),
    Buffer.from(mirrorScreenshot.data, "base64"),
  );

  await evaluate(
    `document.querySelector(".cloudbell-card").scrollIntoView({ block: "start" })`,
  );
  await wait(120);
  const cloudbellClip = await evaluate(`(() => {
    const card = document.querySelector(".cloudbell-card");
    const rect = card.getBoundingClientRect();
    const padding = 24;
    const x = Math.max(0, rect.left + window.scrollX - padding);
    const y = Math.max(0, rect.top + window.scrollY - padding);
    return {
      x,
      y,
      width: Math.min(document.documentElement.scrollWidth - x, rect.width + padding * 2),
      height: Math.min(document.documentElement.scrollHeight - y, rect.height + padding * 2),
      scale: 1,
    };
  })()`);
  const cloudbellScreenshot = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: cloudbellClip,
  });
  await writeFile(
    new URL("cloudbell-herald.png", artifactDir),
    Buffer.from(cloudbellScreenshot.data, "base64"),
  );

  await evaluate(
    `document.querySelector(".karma-lantern").scrollIntoView({ block: "start" })`,
  );
  await wait(120);
  const lanternClip = await evaluate(`(() => {
    const card = document.querySelector(".karma-lantern");
    const rect = card.getBoundingClientRect();
    const padding = 24;
    const x = Math.max(0, rect.left + window.scrollX - padding);
    const y = Math.max(0, rect.top + window.scrollY - padding);
    return {
      x,
      y,
      width: Math.min(document.documentElement.scrollWidth - x, rect.width + padding * 2),
      height: Math.min(document.documentElement.scrollHeight - y, rect.height + padding * 2),
      scale: 1,
    };
  })()`);
  const lanternScreenshot = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: lanternClip,
  });
  await writeFile(
    new URL("karma-lantern.png", artifactDir),
    Buffer.from(lanternScreenshot.data, "base64"),
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
        mirrorSelects: desktop.mirrorSelects,
        mirrorToggles: desktop.mirrorToggles,
        cloudbellCards: desktop.cloudbellCards,
        cloudbellSignature: desktop.cloudbellSignature,
        cloudbellPropagationControls: desktop.cloudbellPropagationControls,
        lanternBriefs: desktop.lanternBriefs,
        lanternStage: desktop.lanternStage,
        lanternEpistemic: desktop.lanternEpistemic,
        lanternOptions: desktop.lanternOptions,
        lanternControls: desktop.lanternControls,
        lanternLiveRegions: desktop.lanternLiveRegions,
        rawMirrorInputs: desktop.rawMirrorInputs,
        unlabeledMirrorControls: desktop.unlabeledMirrorControls,
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
  if (chrome && chrome.exitCode === null && chrome.signalCode === null) {
    const exited = new Promise((resolve) => chrome.once("exit", resolve));
    chrome.kill("SIGTERM");
    await Promise.race([exited, wait(2_000)]);
    if (chrome.exitCode === null && chrome.signalCode === null) {
      chrome.kill("SIGKILL");
      await Promise.race([exited, wait(1_000)]);
    }
  }
  await rm(profile, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}
