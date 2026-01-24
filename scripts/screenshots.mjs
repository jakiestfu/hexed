import puppeteer from "puppeteer"
import { resolve, join } from "node:path"
import { mkdir, rm, mkdtemp, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { spawn, execFile } from "node:child_process"
import { promisify } from "node:util"

const ROOT = process.cwd()
const distDir = resolve(ROOT, "apps/web/dist")
const publicDir = resolve(ROOT, "apps/web/public")
const screenshotsDir = resolve(ROOT, "screenshots")
const port = 4173

await mkdir(screenshotsDir, { recursive: true })

// Start static server
const server = spawn(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["http-server", distDir, "-p", String(port), "-s", "-c-1", "--silent"],
  { stdio: "inherit" }
)

const browser = await puppeteer.launch({
  headless: "new",
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 4 },
})

const execFileAsync = promisify(execFile)

const ensureDir = async (dirPath) => {
  await mkdir(dirPath, { recursive: true })
}


export const screenShotState = async (name, options = {}, browser) => {
  const themes = ["dark", "light"]
  await ensureDir(screenshotsDir)

  for (const theme of themes) {
    const outputPath = resolve(screenshotsDir, `${name}-${theme}.png`)
    const page = await browser.newPage()

    const url = `http://localhost:${port}/#/?${new URLSearchParams({
      theme,
      ...options,
    }).toString()}`

    await page.goto(url, { waitUntil: "networkidle0" })

    await page.waitForSelector("#root", { timeout: 10_000 }).catch(() => { })
    await new Promise((r) => setTimeout(r, 1000))

    await page.screenshot({ path: outputPath, fullPage: true })
    console.log(`✅ Screenshot ${url} saved: ${outputPath}`)

    await page.close()
  }
}

// Core timing config for this animation
const DURATION_MS = 8000;
const FPS = 30;

// Derived values
const FRAME_INTERVAL_MS = 1000 / FPS;
const FRAME_COUNT = Math.round((DURATION_MS / 1000) * FPS);

export const runAnimatedWebpFromPngFrames = async ({
  framesDir,
  fps = FPS,
  outWebpPath,
}) => {
  // Use the same interval rounding logic here so the playback rate
  // matches the capture rate as closely as possible.
  const frameMs = Math.max(1, Math.round(1000 / fps));

  // 1) Convert PNG frames to WebP frames
  await execFileAsync("ffmpeg", [
    "-y",
    "-framerate",
    String(fps),
    "-i",
    join(framesDir, "frame-%03d.png"),
    "-vsync",
    "0",
    "-c:v",
    "libwebp",
    "-lossless",
    "1",
    "-pix_fmt",
    "yuva420p",
    join(framesDir, "frame-%03d.webp"),
  ]);

  // 2) Build animated WebP with webpmux
  const webpFrames = (await readdir(framesDir))
    .filter((f) => /^frame-\d{3}\.webp$/.test(f))
    .sort();

  const muxArgs = [];
  for (const f of webpFrames) {
    // -frame <file> +D+X+Y+M-b
    muxArgs.push(
      "-frame",
      join(framesDir, f),
      `+${frameMs}+0+0+1-b`
    );
  }

  muxArgs.push(
    "-bgcolor",
    "0,0,0,0",
    "-loop",
    "0",
    "-o",
    outWebpPath
  );

  await execFileAsync("webpmux", muxArgs);
};

export const recordLogoAnimation = async (browser) => {
  const themes = ["light", "dark"];
  const selector = ".font-brand";
  const padding = 10;

  await ensureDir(screenshotsDir);

  for (const theme of themes) {
    console.log(`🎥 Recording logo animation for ${theme}...`)
    const page = await browser.newPage();
    await page.setViewport({
      width: 460,
      height: 208,
      deviceScaleFactor: 1,
    })

    const url = `http://localhost:${port}/#/brand/?theme=${theme}`;
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector(selector, { timeout: 10_000 });

    const framesDir = await mkdtemp(join(tmpdir(), `hexed-logo-${theme}-`));

    try {
      // Normalize animation start and background
      await page.evaluate(() => {
        document.querySelectorAll('[class*="bg-"]').forEach((el) => {
          el.className = el.className
            .split(/\s+/)
            .filter((cls) => !cls.startsWith("bg-"))
            .join(" ");
        });
        document.documentElement.classList.add("bg-transparent");
        document.body.classList.add("bg-transparent");
      });

      // cancel
      await page.evaluate(() => {
        document.querySelectorAll('.font-brand [class*="animate"]').forEach((el) => {
          const animations = el.getAnimations();
          animations.forEach((anim) => {
            anim.cancel();
            anim.play();
          });
        });
      });

      await page.evaluate(
        (selector) => {
          const el = document.querySelector(selector)
          if (!el) return
          el.style.transform = 'scale(4)'
          el.style.transformOrigin = 'center'
        },
        selector,
      )

      // Let the animation "settle" and ensure it restarted
      // await page.waitForTimeout(50);
      // await new Promise((r) => setTimeout(r, 50))
      // Play
      // await page.evaluate(() => {
      //   document.querySelectorAll('.font-brand [class*="animate"]').forEach((el) => {
      //     const animations = el.getAnimations();
      //     animations.forEach((anim) => {
      //       anim.play();
      //     });
      //   });
      // });

      const start = performance.now();

      for (let i = 0; i < FRAME_COUNT; i++) {
        const targetTime = start + i * FRAME_INTERVAL_MS;
        const now = performance.now();
        const wait = targetTime - now;
        if (wait > 0) {
          // Align to a more stable timeline than chaining timeouts
          // await page.waitForTimeout(wait);
          await new Promise((r) => setTimeout(r, wait))
        }

        await page.screenshot({
          omitBackground: true,
          path: resolve(framesDir, `frame-${String(i).padStart(3, "0")}.png`),
          // clip: {
          //   x: Math.max(0, box.x - 4 - padding),
          //   y: Math.max(0, box.y - padding),
          //   width: box.width + 5 + padding * 2,
          //   height: box.height + padding * 2,
          // },
        });
      }

      const outWebpPath = resolve(screenshotsDir, `logo-${theme}.webp`);

      await runAnimatedWebpFromPngFrames({
        framesDir,
        fps: FPS,
        outWebpPath,
      });

      console.log(`✅ WebP saved: ${outWebpPath}`);
    } finally {
      await rm(framesDir, { recursive: true, force: true });
      await page.close();
    }
  }
};

export const screenshotBrand = async (browser, {
  width = 180,
  height = 180,
  fontSize = "2.5rem",
} = {}) => {
  const themes = ["dark", "light"]
  const selector = ".font-brand"

  await ensureDir(publicDir)

  for (const theme of themes) {
    const page = await browser.newPage()

    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
    })

    const url = `http://localhost:${port}/#/brand?theme=${theme}`
    await page.goto(url, { waitUntil: "networkidle0" })
    await page.waitForSelector(selector, { timeout: 10_000 })

    await page.evaluate(
      (selector, fontSize) => {
        const el = document.querySelector(selector)
        if (!el) return
        el.style.fontSize = fontSize
      },
      selector,
      fontSize,
    )

    await new Promise((r) => setTimeout(r, 300))

    const element = await page.$(selector)
    const box = await element?.boundingBox()
    if (!box) {
      await page.close()
      throw new Error(`Could not compute bounding box for selector: ${selector}`)
    }

    await page.screenshot({
      path: resolve(
        publicDir,
        `brand-${width}x${height}-${theme}.png`
      ),
      omitBackground: false,
    })

    console.log(`✅ ${theme} app icon saved`)
    await page.close()
  }
}

try {
  // Web app logo animation
  await recordLogoAnimation(browser)

  // App screenshots
  await screenShotState("home", {}, browser)
  await screenShotState("editor", {
    input: "I invoke you, holy angels and holy names, join forces with this restraining spell and bind, tie up, block, strike, overthrow, harm, destroy, kill and shatter Eucherios the charioteer and all his horses tomorrow in the arena of Rome. Let the starting-gates not [open] properly. Let him not compete quickly. Let him not pass. Let him not make the turn properly. Let him not receive the honors. Let him not squeeze over and overpower. Let him not come from behind and pass but instead let him collapse, let him be bound, let him be broken up, and let him drag behind your power. Both in the early races and the later ones. Now, now! Quickly, quickly! In the ancient world, it was common practice to curse or bind an enemy or rival by writing an incantation, such as the one above, on a tablet and dedicating it to a god or spirit. These curses or binding spells, commonly called defixiones, were intended to bring other people under the power and control of those who commissioned them. More than a thousand such texts, written between the fifth century B.C.E. and the fifth century C.E., have been discovered from North Africa to England, and from Syria to Spain. Extending into every aspect of ancient life - athletic and theatrical competitions, judicial proceedings, love affairs, business rivalries, and the recovery of stolen property - they shed new light on a previously neglected dimension of classical study. Potentially harmful to the entrenched reputations of classical Greece and Rome, as well as Judaism and Christianity, as bastions, respectively, of pure philosophy and true religion, these small tablets provide a fascinating perspective on the times as well as a rare, intimate look at the personal lives of the ancient Greeks and Romans.",
    showAscii: true,
  }, browser)

  // App icons
  await screenshotBrand(browser, {
    width: 180,
    height: 180,
    fontSize: "2.4rem",
  })

  // Open graph image
  await screenshotBrand(browser, {
    width: 1200,
    height: 630,
    fontSize: "12rem",
  })
} finally {
  await browser.close()
  server.kill("SIGTERM")
}