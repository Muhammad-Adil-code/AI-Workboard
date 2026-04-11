import puppeteer from 'puppeteer'

const BASE = 'http://localhost:3000'
const OUT = './public/screenshots'

async function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--window-size=1440,900'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

  // ── 1. Main board ──
  console.log('📸 Capturing main board...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(1500)
  await page.screenshot({ path: `${OUT}/board.png`, fullPage: false })

  // ── 2. Add task modal with AI estimate ──
  console.log('📸 Capturing add task modal...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(1000)
  // Click the + button on the first column
  const plusBtns = await page.$$('button')
  for (const btn of plusBtns) {
    const text = await page.evaluate(el => el.textContent, btn)
    if (text?.trim() === '+') { await btn.click(); break }
  }
  await wait(600)
  await page.screenshot({ path: `${OUT}/add-task.png`, fullPage: false })

  // ── 3. Task detail with subtasks ──
  console.log('📸 Capturing task detail with subtasks...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(1500)
  // Click first task card
  const cards = await page.$$('.cursor-pointer')
  if (cards.length > 0) {
    await cards[0].click()
    await wait(800)
    await page.screenshot({ path: `${OUT}/task-detail.png`, fullPage: false })
    // Close modal
    await page.keyboard.press('Escape')
    await wait(300)
  }

  // ── 4. Insights modal ──
  console.log('📸 Capturing insights...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(1500)
  const buttons = await page.$$('button')
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn)
    if (text === 'Insights') { await btn.click(); break }
  }
  await wait(1200)
  await page.screenshot({ path: `${OUT}/insights.png`, fullPage: false })
  await page.keyboard.press('Escape')
  await wait(300)

  // ── 5. Weekly digest ──
  console.log('📸 Capturing weekly digest...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(1500)
  const allBtns = await page.$$('button')
  for (const btn of allBtns) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn)
    if (text?.includes('Weekly Digest')) { await btn.click(); break }
  }
  await wait(2500) // wait for AI response
  await page.screenshot({ path: `${OUT}/digest.png`, fullPage: false })

  // ── 6. Client panel close-up ──
  console.log('📸 Capturing client panel...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(1500)
  const clientPanel = await page.$('.w-72.bg-white.border-l')
  if (clientPanel) {
    const box = await clientPanel.boundingBox()
    if (box) {
      await page.screenshot({
        path: `${OUT}/clients.png`,
        clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 600) },
      })
    }
  }

  await browser.close()
  console.log('\n✅ All screenshots saved to public/screenshots/')
}

run().catch(err => { console.error(err); process.exit(1) })
