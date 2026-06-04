import puppeteer from 'puppeteer'

const BASE = 'http://localhost:3000'
const OUT = './public/screenshots'

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1440,900'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

  // ── 1. Full board ──
  console.log('📸 1/6 Main board...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  await page.screenshot({ path: `${OUT}/board.png` })

  // ── 2. Task detail with subtasks (click a card that HAS subtasks) ──
  console.log('📸 2/6 Task detail with subtasks...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  // Click the "Build admin dashboard" card which has 6 subtasks
  const cards = await page.$$('.bg-white.rounded-xl.border.border-slate-200.p-4')
  let clicked = false
  for (const card of cards) {
    const text = await page.evaluate(el => el.textContent, card)
    if (text?.includes('Build admin dashboard')) {
      await card.click()
      clicked = true
      break
    }
  }
  if (!clicked && cards.length > 1) await cards[1].click()
  await wait(800)
  await page.screenshot({ path: `${OUT}/task-detail.png` })
  await page.keyboard.press('Escape')
  await wait(400)

  // ── 3. Add task modal ──
  console.log('📸 3/6 Add task modal...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  const allBtns = await page.$$('button')
  for (const btn of allBtns) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn)
    if (text === '+') { await btn.click(); break }
  }
  await wait(600)
  // Type a realistic title if input exists
  const titleInput = await page.$('input[placeholder="Task title *"]')
  if (titleInput) {
    await titleInput.type('Redesign onboarding flow for mobile')
    await wait(300)
  }
  await page.screenshot({ path: `${OUT}/add-task.png` })
  await page.keyboard.press('Escape')

  // ── 4. Insights — wait for charts to fully render ──
  console.log('📸 4/6 Insights dashboard...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  const btns2 = await page.$$('button')
  for (const btn of btns2) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn)
    if (text === 'Insights') { await btn.click(); break }
  }
  await wait(2000) // wait for API + recharts render
  await page.screenshot({ path: `${OUT}/insights.png` })
  await page.keyboard.press('Escape')
  await wait(400)

  // ── 5. Weekly digest — wait for full AI response ──
  console.log('📸 5/6 Weekly digest (waiting for AI)...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  const btns3 = await page.$$('button')
  for (const btn of btns3) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn)
    if (text?.includes('Weekly Digest')) { await btn.click(); break }
  }
  // Wait for AI response — up to 20s
  await wait(12000)
  await page.screenshot({ path: `${OUT}/digest.png` })
  await page.keyboard.press('Escape')
  await wait(400)

  // ── 6. Client panel close-up ──
  console.log('📸 6/6 Client panel...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  const panel = await page.$('.bg-white.border-l.border-slate-200.w-72')
  if (panel) {
    const box = await panel.boundingBox()
    if (box) {
      await page.screenshot({
        path: `${OUT}/clients.png`,
        clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 520) },
      })
    }
  }

  await browser.close()
  console.log('\n✅ All 6 screenshots saved to public/screenshots/')
}

run().catch(err => { console.error(err); process.exit(1) })
