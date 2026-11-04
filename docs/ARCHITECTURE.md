# Architecture

The MVP is a static, low-cost pipeline suitable for GitHub Pages.

```text
Four licensed official sources
  -> source-specific Python connectors
  -> normalization + Pydantic validation
  -> versioned JSON snapshot
  -> React client-side search
  -> GitHub Pages
```

## Design decisions

- `HashRouter` avoids refresh 404s on GitHub Pages without a server rewrite rule.
- The MVP uses a small hand-authored CSS design system instead of Tailwind. This removes a build-time styling dependency while keeping dark/light and responsive layouts; Tailwind can be introduced later without changing the data layer.
- Leaflet is deferred because the integrated source supplies land-parcel text but no verified coordinates. Rendering invented or casually geocoded markers would violate the location-precision rule.
- Each source updates independently. A failed source retains its previous validated rows, records a `stale` or `failed` health state, and cannot erase the other sources. JSON output is replaced atomically only after validation.
- Missing coordinates remain `null`; the MVP does not render approximate markers.
- Search is client-side and paginated at 24 cards. Move to a search backend only when data volume makes the static payload unsuitable.
- Favorites use LocalStorage and collect no account data.
- Duplicate detection only flags conservative candidates, with a confidence score and explicit matching basis. It never merges or removes official rows.
- Comparison selections are browser-local, limited to four records, and keep reserve and final prices in separate rows.
- A restrictive meta Content Security Policy is included because GitHub Pages cannot set repository-specific response headers. A reverse proxy or custom host should set CSP as an HTTP header for stronger enforcement.

## Future boundaries

Leaflet maps, additional current-auction connectors, and real-price analytics remain Phase 2/3 work. Comparison and CSV export are already client-side features. A backend becomes appropriate for authentication, subscriptions, private data, high-volume search, or notification delivery.
