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

const fps = 60
const delayMs = Math.round(1000 / fps) // 17ms
const durationMs = 4000
const frameCount = Math.round((durationMs / 1000) * fps) // 120

export const runAnimatedWebpFromPngFrames = async ({
  framesDir,
  fps,
  outWebpPath,
}) => {
  // WebP frame duration is in whole milliseconds
  const frameMs = Math.max(1, Math.round(1000 / fps))

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
  ])

  // 2) Build animated WebP with webpmux using:
  //    dispose=1 (clear to transparent background) and -b (NO_BLEND)
  //    This prevents the “burn-in / trailing” effect.  [oai_citation:2‡Stack Overflow](https://stackoverflow.com/questions/58374189/convert-a-bunch-of-png-or-webp-images-to-a-webp-animation)
  const webpFrames = (await readdir(framesDir))
    .filter((f) => /^frame-\d{3}\.webp$/.test(f))
    .sort()

  const muxArgs = []
  for (const f of webpFrames) {
    // Syntax: -frame <file> +D+X+Y+M±b
    // D=duration ms, X/Y=0 offsets, M=1 dispose-to-background, -b=no blend
    muxArgs.push(
      "-frame",
      join(framesDir, f),
      `+${frameMs}+0+0+1-b`
    )
  }

  // bgcolor A,R,G,B (set to fully transparent)
  muxArgs.push("-bgcolor", "0,0,0,0", "-loop", "0", "-o", outWebpPath)

  await execFileAsync("webpmux", muxArgs)
}

export const screenshotLogo = async (browser) => {
  const themes = ["dark", "light"]
  const selector = ".font-brand"
  const padding = 0

  await ensureDir(screenshotsDir)

  for (const theme of themes) {
    const page = await browser.newPage()

    const url = `http://localhost:${port}/#/?theme=${theme}`
    await page.goto(url, { waitUntil: "networkidle0" })
    await page.waitForSelector(selector, { timeout: 10_000 })

    const element = await page.$(selector)
    const box = await element.boundingBox()
    if (!box) {
      await page.close()
      throw new Error(`Could not compute bounding box for selector: ${selector}`)
    }

    // Temp dir for frames (auto-cleaned)
    const framesDir = await mkdtemp(join(tmpdir(), `hexed-logo-${theme}-`))

    try {
      await page.evaluate(() => {
        document.querySelectorAll('.font-brand [class*="animate"]').forEach((el) => {
          const animations = el.getAnimations();
          animations.forEach((anim) => {
            anim.cancel();
            anim.play();
          })
        })

        document.querySelectorAll('[class*="bg-"]').forEach((el) => {
          el.className = el.className
            .split(/\s+/)
            .filter((cls) => !cls.startsWith('bg-'))
            .join(' ')
        })
        document.documentElement.classList.add('bg-transparent')
        document.body.classList.add('bg-transparent')
      })
      for (let i = 0; i < frameCount; i++) {
        await page.screenshot({
          omitBackground: true,
          path: resolve(
            framesDir,
            `frame-${String(i).padStart(3, "0")}.png`
          ),
          clip: {
            x: Math.max(0, box.x - 4),
            y: Math.max(0, box.y + 4),
            width: box.width + 5,
            height: box.height - 4,
          },
        })

        await new Promise((r) => setTimeout(r, delayMs))
      }

      const outWebpPath = resolve(screenshotsDir, `logo-${theme}.webp`)

      await runAnimatedWebpFromPngFrames({
        framesDir,
        // frameGlob: "frame-%03d.png",
        fps,
        outWebpPath,
        // lossless: true, // best for crisp typography + alpha
      })

      console.log(`✅ WebP saved: ${outWebpPath}`)
    } finally {
      // cleanup temp frames dir
      await rm(framesDir, { recursive: true, force: true })
      await page.close()
    }
  }
}

export const appIcons = async (browser) => {
  const themes = ["dark", "light"]
  const selector = ".font-brand"
  const SIZE = 180

  await ensureDir(publicDir)

  for (const theme of themes) {
    const page = await browser.newPage()

    await page.setViewport({
      width: 800,
      height: 600,
      deviceScaleFactor: 1,
    })

    const url = `http://localhost:${port}/#/?theme=${theme}`
    await page.goto(url, { waitUntil: "networkidle0" })
    await page.waitForSelector(selector, { timeout: 10_000 })

    // Height already set elsewhere, but safe to ensure
    await page.evaluate(
      (selector, height) => {
        const el = document.querySelector(selector)
        if (!el) return
        el.style.height = `${height}px`
        el.style.width = `${height}px`
        el.style.fontSize = '2rem'
      },
      selector,
      SIZE
    )

    await new Promise((r) => setTimeout(r, 1000))

    const element = await page.$(selector)
    const box = await element?.boundingBox()
    if (!box) {
      await page.close()
      throw new Error(`Could not compute bounding box for selector: ${selector}`)
    }

    await page.screenshot({
      path: resolve(
        publicDir,
        `app-icon-${theme}.png`
      ),
      omitBackground: true,
      clip: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      },
    })

    console.log(`✅ ${theme} app icon saved`)
    await page.close()
  }
}

try {
  await screenshotLogo(browser)
  await screenShotState("home", {}, browser)
  await screenShotState("editor", {
    input: "I invoke you, holy angels and holy names, join forces with this restraining spell and bind, tie up, block, strike, overthrow, harm, destroy, kill and shatter Eucherios the charioteer and all his horses tomorrow in the arena of Rome. Let the starting-gates not [open] properly. Let him not compete quickly. Let him not pass. Let him not make the turn properly. Let him not receive the honors. Let him not squeeze over and overpower. Let him not come from behind and pass but instead let him collapse, let him be bound, let him be broken up, and let him drag behind your power. Both in the early races and the later ones. Now, now! Quickly, quickly! In the ancient world, it was common practice to curse or bind an enemy or rival by writing an incantation, such as the one above, on a tablet and dedicating it to a god or spirit. These curses or binding spells, commonly called defixiones, were intended to bring other people under the power and control of those who commissioned them. More than a thousand such texts, written between the fifth century B.C.E. and the fifth century C.E., have been discovered from North Africa to England, and from Syria to Spain. Extending into every aspect of ancient life - athletic and theatrical competitions, judicial proceedings, love affairs, business rivalries, and the recovery of stolen property - they shed new light on a previously neglected dimension of classical study. Potentially harmful to the entrenched reputations of classical Greece and Rome, as well as Judaism and Christianity, as bastions, respectively, of pure philosophy and true religion, these small tablets provide a fascinating perspective on the times as well as a rare, intimate look at the personal lives of the ancient Greeks and Romans.",
    showAscii: true,
  }, browser)
  await appIcons(browser)
} finally {
  await browser.close()
  server.kill("SIGTERM")
}