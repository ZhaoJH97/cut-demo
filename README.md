# CUT audio demo

Interactive listening page for **CUT: Chromatic-temporal U-Transformer for Expressive Multi-track MIDI Parameter Estimation**.

## Local preview

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## GitHub Pages

The included workflow builds a static export and deploys it whenever `main` is pushed. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Sample mapping

| Example | File 1 | File 2 | File 3 | File 4 |
| --- | --- | --- | --- | --- |
| 1 | Ground truth | CUT | Baseline | Anchor |
| 2 | Anchor | Baseline | Ground truth | CUT |
| 3 | CUT | Anchor | Ground truth | Baseline |
