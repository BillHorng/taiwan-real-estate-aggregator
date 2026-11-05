# General listing source onboarding

The platform currently has no licensed private-market listing feed. The nine private listing services in the source registry are official-link entries only; their visible web pages are not treated as reusable datasets.

## Admission requirements

A private listing source can change from `official_link_only` to `integrated` only after all of the following are recorded:

1. The legal entity providing the data and a working contact.
2. A written API, feed, export, or data-cooperation permission.
3. Permitted fields, purposes, retention period, refresh frequency, and redistribution scope.
4. Separate permission for photos and descriptions. Without it, those fields must be omitted.
5. A supported delivery method such as documented API, signed JSON/CSV export, SFTP, or a manually uploaded official export.
6. A revocation and deletion procedure.
7. A sample payload that passes schema validation without invented fields.

Robots exclusions, CAPTCHAs, authentication gates, undocumented browser endpoints, and rotating request identities are not acceptable integration methods.

## Minimum feed fields

```text
source_id
external_listing_id
source_url
title
property_category
transaction_type
county
district
address
address_precision
total_price
building_area_ping
land_area_ping
listing_status
source_updated_at
last_verified_at
```

Unknown values must remain empty. Coordinates may be supplied only with a declared precision and must pass the existing paired latitude/longitude validation. Asking price, transaction price, reserve price, and awarded price must remain separate.

## Import workflow

```text
signed cooperation record
  -> source-specific JSON/CSV mapping
  -> normalized Property records
  -> Pydantic validation
  -> duplicate-candidate marking (no forced merge)
  -> isolated source chunk
  -> manifest and source registry update
  -> frontend disclosure and QA
```

The first authorized partner connector should be implemented against a retained sample export before any scheduled synchronization is enabled. A failed refresh must retain the previous validated rows and mark the source stale; it must not mark listings as sold.

## Current private listing registry

- 591 房屋交易網
- 永慶房屋
- 信義房屋
- 台灣房屋
- 住商不動產
- 中信房屋
- 東森房屋
- 有巢氏房屋
- 太平洋房屋

All nine remain `official_link_only` as of 2026-11-04.

## Browser-local CSV contract

The comparison workspace supports local CSV import and export without treating the file as a licensed partner feed. The required header is:

```text
source_name,source_url,title,county,district,address,total_price_wan,building_area_ping,building_age,rooms,bathrooms,parking
```

`total_price_wan` is expressed in ten-thousand New Taiwan dollars and is converted to TWD internally. Source URL, source name, and title are required. Imported URLs must use HTTP(S), and normalized duplicates are skipped. These browser-local records are never added to the public official-data snapshot.

## Authorized feed validator

After receiving a real cooperation feed, validate the normalized JSON before connecting it to the public dataset:

```bash
python scripts/import_authorized_feed.py \
  --manifest permission.json \
  --input normalized-records.json \
  --output validated-partner-chunk.json
```

The permission manifest must name the source and permission holder, include a traceable permission reference and verification date, list permitted fields, and explicitly set `redistribution_allowed` to `true`. The validator rejects mismatched source identities, non-sale records, invalid Property rows, and descriptions or image fields outside the permission scope. It does not automatically mark a source integrated or publish the output.
