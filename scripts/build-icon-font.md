# Rebuilding the icon subset

`public/fonts/icofont-subset.woff2` and `public/css/icofont.css` are a subset of
IcoFont. The full face is 2,095 glyphs and 525KB; the subset ships 525 glyphs at
97KB. The full face stays in the repository at `public/fonts/icofont.woff2` and
is not served.

The subset is everything the site and the catalogue use, plus every icon whose
name matches a business, tech or education keyword, so an icon chosen in the
admin almost always already exists.

## When to rebuild

Only if someone picks an icon that is not in the subset. It renders as blank
rather than as a wrong glyph, so it is visible rather than silent. Check with:

    grep -c 'icofont-<name>:before' public/css/icofont.css

## How

Needs `fonttools` and `brotli`, in a venv since the system Python is managed:

    python3 -m venv .venv && .venv/bin/pip install fonttools brotli

1. Take the class-to-codepoint map from the full CSS. It is in git history, or
   from the IcoFont release. The pattern is `.icofont-name:before{content:"\eXXX"}`.
2. Collect what is in use:
   - markup: `grep -rho 'icofont-[a-z0-9-]*' public src`
   - database: `npx wrangler d1 execute invoicing --remote --command \
       "SELECT DISTINCT icon FROM catalogue_items WHERE icon != ''"`
     (stored without the `icofont-` prefix; the code adds it)
3. Add the keyword net, then subset:

    .venv/bin/pyftsubset public/fonts/icofont.woff2 \
      --unicodes-file=unicodes.txt --flavor=woff2 \
      --layout-features='' --no-hinting --desubroutinize \
      --output-file=public/fonts/icofont-subset.woff2

4. Rewrite `public/css/icofont.css`: keep the `@font-face` and the two base
   `[class*=" icofont-"]` rules, point `src` at the subset, keep
   `font-display:swap`, and emit only the `:before` rules you kept.

## Note

`icofont-idea` was referenced on the homepage, `/service` and one catalogue row
and does not exist in IcoFont at all, so it had always rendered as nothing. It
is now `icofont-light-bulb`. Worth checking a name exists before using it.
