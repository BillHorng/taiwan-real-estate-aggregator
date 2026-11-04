# Deployment

## Local

```bash
npm install
npm run dev
```

Data pipeline:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scripts/update_data.py
python scripts/validate_snapshot.py
pytest
```

## GitHub Pages

1. Push the repository with the default branch named `main`.
2. In Settings → Pages, choose “GitHub Actions” as source.
3. Run “Deploy to GitHub Pages” or push to `main`. The relative Vite base supports any repository name.

The deployment uses only `contents: read`, `pages: write`, and `id-token: write`. The scheduled data job requires `contents: write` to commit a snapshot only after Python tests, frontend tests, type checking, and the production build pass. Its `data-update` concurrency group is separate from the normal Pages deployment. If branch protection blocks bot pushes, replace the push step with a pull-request workflow.

## Troubleshooting

- Blank assets / 404: confirm GitHub Pages is using the Actions source and the uploaded artifact contains `index.html`.
- Child route refresh: this project uses hash routing (`/#/properties/...`) specifically to avoid Pages rewrite limitations.
- Data update failed: keep the last committed snapshot; inspect the workflow log. Do not treat connection failure as a closed case.
- Scheduled workflow stopped: GitHub may disable schedules on inactive public repositories; re-enable Actions or run it manually.
