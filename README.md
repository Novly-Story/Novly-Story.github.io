# Novely website

The public GitHub Pages site for Novely, a free Mac writing app for novels and picture books.

- Website: https://novly-story.github.io
- Public installers and release notes: https://github.com/Novly-Story/releases
- App source: maintained separately in the private application repository.

## Preview and publish

No build or package installation is needed:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://localhost:4173. GitHub Pages serves `main` at `/`; pushing that branch updates the site.

`brand.html` is a no-index comparison of the previous and refined logo, including small-size and light/dark previews.

## Shared brand assets

The website does not have a separate logo. Its SVG, PNG and favicon are generated from the app's `App/Resources/Brand/NovelyIcon.svg`:

```bash
# From the application repository:
python3 scripts/generate-brand.py --website ../Novly-Story.github.io
```

Screenshots contain an illustrative fictional manuscript. Fonts are hosted locally; their SIL Open Font License notices are in `assets/FONT-LICENSES.txt`.

Download buttons currently lead to the public distribution repository. A first installer must be signed, notarized and published before linking directly to `releases/latest/download/Novely.dmg`.
