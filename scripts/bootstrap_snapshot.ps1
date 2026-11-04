param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\public\data\properties.json')
)
$ErrorActionPreference = 'Stop'
$raw = [System.IO.File]::ReadAllText((Resolve-Path $InputPath), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$syncedAt = [DateTimeOffset]::Now
$sha = [System.Security.Cryptography.SHA256]::Create()
$records = foreach ($row in $raw) {
  $mark = [string]$row.mark
  $county = $null
  $district = $null
  if ($mark -match '^(.+?[縣市])(.+?[區鄉鎮市])') { $county = $Matches[1]; $district = $Matches[2] }
  $area = if ($row.area -match '^[\d,.]+$') { [double]($row.area -replace ',', '') } else { $null }
  $reserve = if ($row.'base-price' -match '^[\d,.]+$') { [double]($row.'base-price' -replace ',', '') } else { $null }
  $deposit = if ($row.earnest -match '^[\d,.]+$') { [double]($row.earnest -replace ',', '') } else { $null }
  $key = @($row.name, $row.year, $row.'batch-no', $row.number, $mark) -join '|'
  $hash = [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($key))).Replace('-', '').ToLower().Substring(0, 20)
  $stopped = [string]$row.stop -notin @('', '0', 'false', 'False')
  $status = if ($stopped) { 'suspended' } elseif ($row.'bid-date') { if ([datetime]$row.'bid-date' -ge $syncedAt.Date) { 'upcoming' } else { 'ended' } } else { 'unknown' }
  $category = if ($mark -match '建號' -and $mark -match '地號') { 'mixed' } elseif ($mark -match '建號') { 'building' } elseif ($mark -match '地號') { 'land' } else { 'unknown' }
  $present = @($mark, $county, $district, $reserve, $area, $row.'bid-date', $row.'bulletin-url', $deposit) | Where-Object { $null -ne $_ -and $_ -ne '' }
  [ordered]@{
    id = "fnp-$hash"; source_id = 'fnp-9655'; source_name = '財政部國有財產署'
    source_url = if ($row.'bulletin-url') { $row.'bulletin-url' } else { 'https://data.gov.tw/dataset/9655' }
    external_listing_id = $hash; title = if ($mark) { $mark } else { "國有非公用不動產標售（標號 $($row.number)）" }
    description = if ($row.memo) { $row.memo } else { $null }; property_category = $category; transaction_type = 'government_sale'
    county = $county; district = $district; address = if ($mark) { $mark } else { $null }; address_precision = if ($mark) { 'land_parcel' } else { 'unknown' }
    latitude = $null; longitude = $null; location_precision = 'none'; total_price = $reserve
    unit_price = if ($reserve -and $area) { [Math]::Round($reserve / ($area * 0.3025), 2) } else { $null }
    building_area_ping = $null; land_area_ping = if ($null -ne $area) { [Math]::Round($area * 0.3025, 4) } else { $null }
    building_age = $null; floor = $null; rooms = $null; bathrooms = $null; parking = $null; auction_type = '國有非公用財產標售'
    auction_round = $null; auction_date = if ($row.'bid-date') { $row.'bid-date' } else { $null }; reserve_price = $reserve; deposit = $deposit
    case_number = if ($row.number) { [string]$row.number } else { $null }; ownership_share = $null; handover_status = $null; listing_status = $status
    first_seen_at = $syncedAt.ToString('o'); last_seen_at = $syncedAt.ToString('o'); last_verified_at = $syncedAt.ToString('o')
    source_updated_at = if ($row.'post-date') { $row.'post-date' } else { $null }; data_quality_score = [Math]::Round($present.Count / 8, 3)
    source_details = [ordered]@{ agency = $row.name; year = $row.year; batch_no = $row.'batch-no'; type_code = $row.type; use = $row.use; notice_url = $row.'notice-url'; sample_url = $row.'sample-url'; image_reference = $row.code }
  }
}
$payload = [ordered]@{
  schema_version = '1.0.0'
  generated_at = $syncedAt.ToString('o')
  source_attribution = '財政部國有財產署－國有非公用財產標售不動產資訊（政府資料開放授權條款第1版）'
  records = @($records)
}
$json = $payload | ConvertTo-Json -Depth 8
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText([System.IO.Path]::GetFullPath($OutputPath), $json, $utf8NoBom)
Write-Output "Wrote $($records.Count) records to $OutputPath"
