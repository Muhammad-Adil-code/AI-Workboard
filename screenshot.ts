import puppeteer from 'puppeteer'

const BASE = 'http://localhost:3000'
const OUT = './public/screenshots'
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--window-size=1440,900'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

  // 1. Full board
  console.log('📸 1/6 Main board...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  await page.screenshot({ path: `${OUT}/board.png` })

  // 2. Task detail with subtasks — click "Build admin dashboard"
  console.log('📸 2/6 Task detail with subtasks...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  const cards = await page.$$('.bg-white.rounded-xl.border.border-slate-200.p-4')
  let clicked = false
  for (const card of cards) {
    const text = await page.evaluate(el => el.textContent, card)
    if (text?.includes('Build admin dashboard')) { await card.click(); clicked = true; break }
  }
  if (!clicked && cards.length > 1) await cards[1].click()
  await wait(800)
  await page.screenshot({ path: `${OUT}/task-detail.png` })
  await page.keyboard.press('Escape')
  await wait(400)

  // 3. Add task modal
  console.log('📸 3/6 Add task modal...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  const plusBtns = await page.$$('button')
  for (const btn of plusBtns) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn)
    if (text === '+') { await btn.click(); break }
  }
  await wait(600)
  const titleInput = await page.$('input[placeholder="Task title *"]')
  if (titleInput) await titleInput.type('Redesign onboarding flow for mobile')
  await wait(300)
  await page.screenshot({ path: `${OUT}/add-task.png` })
  await page.keyboard.press('Escape')
  await wait(300)

  // 4. Insights modal
  console.log('📸 4/6 Insights dashboard...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  const btns = await page.$$('button')
  for (const btn of btns) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn)
    if (text === 'Insights') { await btn.click(); break }
  }
  await wait(2000)
  await page.screenshot({ path: `${OUT}/insights.png` })
  await page.keyboard.press('Escape')
  await wait(400)

  // 5. Weekly digest — wait for AI
  console.log('📸 5/6 Weekly digest (waiting for AI)...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  const btns2 = await page.$$('button')
  for (const btn of btns2) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn)
    if (text?.includes('Weekly Digest')) { await btn.click(); break }
  }
  await wait(10000)
  await page.screenshot({ path: `${OUT}/digest.png` })
  await page.keyboard.press('Escape')
  await wait(400)

  // 6. Voice AI overlay — click Voice AI button
  console.log('📸 6/6 Voice AI overlay...')
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await wait(2000)
  const btns3 = await page.$$('button')
  for (const btn of btns3) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn)
    if (text?.includes('Voice AI')) { await btn.click(); break }
  }
  await wait(1500)
  await page.screenshot({ path: `${OUT}/voice.png` })

  await browser.close()
  console.log('\n✅ All 6 screenshots saved!')
}

run().catch(err => { console.error(err); process.exit(1) })
