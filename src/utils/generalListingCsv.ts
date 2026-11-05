import type { UserListingInput } from '../hooks/useUserListings'
import type { Property } from '../types/property'

export const generalListingCsvHeaders = [
  'source_name', 'source_url', 'title', 'county', 'district', 'address', 'total_price_wan',
  'building_area_ping', 'building_age', 'rooms', 'bathrooms', 'parking',
] as const

const escapeCell = (value: unknown) => {
  const text = value == null ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function parseRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1 }
      else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === ',') { row.push(cell); cell = '' }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = '' }
    else cell += char
  }
  if (quoted) throw new Error('CSV 含有未關閉的引號。')
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row) }
  return rows.filter(values => values.some(value => value.trim()))
}

const optionalNumber = (value: string, rowNumber: number, field: string) => {
  if (!value.trim()) return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) throw new Error(`第 ${rowNumber} 列 ${field} 必須是非負數字。`)
  return number
}

export function parseGeneralListingCsv(text: string): UserListingInput[] {
  const rows = parseRows(text.replace(/^\uFEFF/, ''))
  if (!rows.length) return []
  const headers = rows[0].map(value => value.trim())
  const missing = generalListingCsvHeaders.filter(header => !headers.includes(header))
  if (missing.length) throw new Error(`CSV 缺少欄位：${missing.join('、')}`)
  return rows.slice(1).map((values, index) => {
    const rowNumber = index + 2
    const get = (name: typeof generalListingCsvHeaders[number]) => (values[headers.indexOf(name)] ?? '').trim()
    if (!get('source_name') || !get('source_url') || !get('title')) throw new Error(`第 ${rowNumber} 列缺少來源、網址或物件名稱。`)
    const priceWan = optionalNumber(get('total_price_wan'), rowNumber, 'total_price_wan')
    return {
      source_name: get('source_name'), source_url: get('source_url'), title: get('title'), county: get('county'), district: get('district'), address: get('address'),
      total_price: priceWan == null ? null : priceWan * 10_000, building_area_ping: optionalNumber(get('building_area_ping'), rowNumber, 'building_area_ping'),
      building_age: optionalNumber(get('building_age'), rowNumber, 'building_age'), rooms: optionalNumber(get('rooms'), rowNumber, 'rooms'),
      bathrooms: optionalNumber(get('bathrooms'), rowNumber, 'bathrooms'), parking: get('parking'),
    }
  })
}

export function exportGeneralListingsCsv(listings: Property[]) {
  const rows = listings.map(item => [
    item.source_name, item.source_url, item.title, item.county, item.district, item.address,
    item.total_price == null ? '' : item.total_price / 10_000, item.building_area_ping, item.building_age, item.rooms, item.bathrooms, item.parking,
  ])
  return `\uFEFF${[generalListingCsvHeaders, ...rows].map(row => row.map(escapeCell).join(',')).join('\r\n')}\r\n`
}

export function emptyGeneralListingCsv() {
  return `\uFEFF${generalListingCsvHeaders.join(',')}\r\n`
}
