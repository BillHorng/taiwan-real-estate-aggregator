import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/#/general-listings')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('creates, filters and reloads a general listing detail route', async ({ page }) => {
  await page.getByLabel('來源網站 *').fill('測試來源')
  await page.getByLabel('原始物件網址 *').fill('https://example.com/e2e/home')
  await page.getByLabel('物件名稱 *').fill('E2E 大安住宅')
  await page.getByLabel('縣市').fill('臺北市')
  await page.getByLabel('行政區').fill('大安區')
  await page.getByLabel('房屋類型').fill('住宅大樓')
  await page.getByLabel('總價（萬元）').fill('2000')
  await page.getByLabel('建物坪數').fill('25')
  await page.getByRole('button', { name: '儲存到瀏覽器' }).click()
  await expect(page.getByRole('link', { name: 'E2E 大安住宅' })).toBeVisible()
  await page.getByPlaceholder('搜尋名稱、來源、地址或行政區…').fill('大安')
  await expect(page.getByText(/符合 1／共 1 筆/)).toBeVisible()
  await page.getByRole('link', { name: 'E2E 大安住宅' }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'E2E 大安住宅' })).toBeVisible()
})

test('imports a legacy CSV without requiring new optional columns', async ({ page }) => {
  const csv = 'source_name,source_url,title,county,district,address,total_price_wan,building_area_ping,building_age,rooms,bathrooms,parking\n來源,https://example.com/csv,舊版 CSV 房源,臺中市,西屯區,,1200,30,10,3,2,平面\n'
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'listings.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expect(page.getByText('舊版 CSV 房源')).toBeVisible()
  await expect(page.getByText(/CSV 匯入完成：新增 1 筆/)).toBeVisible()
})

test('exposes advanced government filters and survives route reload', async ({ page }) => {
  await page.goto('/#/properties')
  await expect(page.getByRole('heading', { name: '政府標售與拍賣資料' })).toBeVisible()
  await expect(page.getByLabel('拍賣／標售機關')).toBeVisible()
  await expect(page.getByLabel('最低保證金')).toBeVisible()
  await expect(page.getByLabel('開標日自')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '政府標售與拍賣資料' })).toBeVisible()
})

test('shows truthful official-link state for unavailable auction feeds', async ({ page }) => {
  await page.goto('/#/judicial-auctions')
  await expect(page.getByRole('heading', { name:'法院法拍' })).toBeVisible()
  await expect(page.getByText('目前 0 筆正式接入')).toBeVisible()
  await expect(page.getByRole('link', { name:/開啟官方入口/ })).toHaveAttribute('href', /judicial\.gov\.tw/)
})

test('shows an actionable Google Maps configuration state without a key', async ({ page }) => {
  await page.goto('/#/map')
  await expect(page.getByRole('heading', { name: 'Google Maps 地圖搜尋' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Google Maps 尚未設定' })).toBeVisible()
  await expect(page.getByText('VITE_GOOGLE_MAPS_API_KEY')).toBeVisible()
})

test('loads every primary route without uncaught page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (const route of ['/', '/general-listings', '/map', '/real-price', '/compare', '/favorites', '/properties', '/judicial-auctions', '/enforcement-auctions', '/financial-auctions', '/sources']) {
    await page.goto(`/#${route}`)
    await expect(page.locator('main')).toBeVisible()
  }
  expect(errors).toEqual([])
})
