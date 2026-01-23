import puppeteer from "puppeteer"
import { resolve, join } from "node:path"
import { mkdir, rm, mkdtemp, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { spawn, execFile } from "node:child_process"
import { promisify } from "node:util"

const ROOT = process.cwd()
const distDir = resolve(ROOT, "apps/web/dist")
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
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 3 },
})

const execFileAsync = promisify(execFile)

const ensureDir = async (dirPath) => {
  await mkdir(dirPath, { recursive: true })
}

const runFfmpegGifFromFrames = async ({
  framesDir,
  frameGlob,
  fps,
  outGifPath,
}) => {
  // palette-based GIF for quality + smaller file size
  const palettePath = join(framesDir, "palette.png")

  // 1) palettegen
  await execFileAsync("ffmpeg", [
    "-y",
    "-framerate",
    String(fps),
    "-i",
    join(framesDir, frameGlob),
    "-vf",
    "palettegen",
    palettePath,
  ])

  // 2) paletteuse
  await execFileAsync("ffmpeg", [
    "-y",
    "-framerate",
    String(fps),
    "-i",
    join(framesDir, frameGlob),
    "-i",
    palettePath,
    "-lavfi",
    "paletteuse=dither=bayer:bayer_scale=5",
    outGifPath,
  ])
}


export const runAnimatedWebpFromPngFrames = async ({
  framesDir,
  fps,
  outWebpPath,
}) => {
  // WebP frame duration is in whole milliseconds
  const frameMs = Math.max(1, Math.round(1000 / fps))

  // 1) Convert PNG frames -> WebP still frames (lossless, keeps alpha)
  //    frame-000.png -> frame-000.webp
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
const durationMs = 2000
const frameCount = Math.round((durationMs / 1000) * fps) // 120

export const screenshotLogo = async (browser) => {
  const themes = ["dark", "light"]
  const selector = ".font-brand"
  const padding = 10

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
            x: Math.max(0, box.x - padding),
            y: Math.max(0, box.y - padding),
            width: box.width + padding * 2,
            height: box.height + padding * 2,
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

try {
  await screenshotLogo(browser)
  await screenShotState("home", {}, browser)
  await screenShotState("editor", {
    input: "We can only see a short distance ahead, but we can see plenty there that needs to be done.",
    showAscii: true,
  }, browser)
  // await Promise.all([
  // ])
} finally {
  await browser.close()
  server.kill("SIGTERM")
}