# Architecture

The MVP is a static, low-cost pipeline suitable for GitHub Pages.

The primary product flow is general-listing comparison. User-entered candidates are stored only in browser LocalStorage and keep their original listing URLs. Government datasets are an independent secondary module; their record volume must not be presented as private-market listing coverage.

```text
Five licensed sale/auction sources
  -> source-specific Python connectors
  -> normalization + Pydantic validation
  -> versioned full JSON snapshot (compatibility)
  -> manifest + current/source JSON chunks
  -> React lazy-loading data service
  -> GitHub Pages

MOI real-price CSV ZIP
  -> dedicated connector + RealPriceRecord validation
  -> real-price.json (historical transactions only)
  -> lazy-loaded regional analytics and asking-price comparison

MOI quarterly historical CSV ZIPs
  -> sale-main rows only
  -> national/county/district + building-type aggregation
  -> real-price-history.json (no raw quarterly archives committed)
  -> publication-quarter trend chart and labeled yearly indicator
```

## Design decisions

- `HashRouter` avoids refresh 404s on GitHub Pages without a server rewrite rule.
- The MVP uses a small hand-authored CSS design system instead of Tailwind. This removes a build-time styling dependency while keeping dark/light and responsive layouts; Tailwind can be introduced later without changing the data layer.
- Leaflet is deferred because the integrated source supplies land-parcel text but no verified coordinates. Rendering invented or casually geocoded markers would violate the location-precision rule.
- Each source updates independently. A failed source retains its previous validated rows, records a `stale` or `failed` health state, and cannot erase the other sources. JSON output is replaced atomically only after validation.
- Missing coordinates remain `null`; the MVP does not render approximate markers.
- Search is client-side and paginated at 24 cards. Move to a search backend only when data volume makes the static payload unsuitable.
- `property-manifest.json` contains counts and chunk metadata. Dashboard and source-status views use the manifest, while the dashboard loads only `properties/current.json` for cards.
- Full search, details, favorites, and comparison load the five source chunks on demand through the shared data service. `properties.json` remains available as a one-release compatibility snapshot and fallback.
- The update workflow writes the full snapshot first, validates it, then replaces source chunks and finally the manifest. Publishing the manifest last prevents clients from discovering incomplete chunk sets.
- Favorites use LocalStorage and collect no account data.
- User-entered general listings use a separate `trea-general-listings-v1` LocalStorage collection, are normalized into the shared `Property` interface with `transaction_type: sale`, and can use the same four-item comparison engine as official records. `/general-listings` performs in-browser keyword and compound filtering, sorting, and pagination without loading government chunks; `/general-listings/:id` reads the same local record for a traceable detail and manual price-history view.
- Manual entries accept only HTTP(S) source URLs. They have no implied source authorization, are labeled as user-entered, and are never written into the published official snapshot.
- General-listing URLs are normalized before duplicate checks. Editing preserves the stable local ID and appends a timestamped price-history entry when the asking price changes.
- CSV import/export uses an explicit twelve-column contract and ten-thousand-TWD input units. Invalid rows and normalized duplicate URLs are reported instead of silently replacing existing candidates.
- General-listing favorites and comparisons resolve LocalStorage candidates first. The 23 MiB government snapshot is loaded only when the selected IDs actually include official records.
- Duplicate detection only flags conservative candidates, with a confidence score and explicit matching basis. It never merges or removes official rows.
- Comparison selections are browser-local, limited to four records, and keep reserve and final prices in separate rows.
- A restrictive meta Content Security Policy is included because GitHub Pages cannot set repository-specific response headers. A reverse proxy or custom host should set CSP as an HTTP header for stronger enforcement.
- Real-price registrations use a separate `RealPriceRecord` schema and lazy-loaded `real-price.json`. They are never mixed into available listings. `/real-price` reports sample counts and medians for explicit filters, and compares browser-local asking price with the same county/district transaction median while disclosing the period and uncertainty.
- `update_real_price_history.py` begins at 2025 Q1 and downloads only official completed quarters absent from the committed aggregate. This keeps recurring Actions inexpensive. Quarterly medians are exact for each source archive; the yearly display is a sample-count-weighted quarterly-median indicator, not an exact annual median.

## Future boundaries

Leaflet district-level maps, current and seven-quarter regional real-price analytics, comparison, and CSV export are client-side features. The map joins user listings to 368 NLSC administrative-area centroids and never presents those points as building coordinates. Exact-address geocoding, additional current-auction connectors, and longer-horizon or model-based analytics remain Phase 2/3 work. A backend becomes appropriate for authentication, subscriptions, private data, high-volume search, or notification delivery.
