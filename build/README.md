# Rebuilding the site

The live pages (`index.html`, `services/index.html`, `studio/index.html`,
`contact/index.html`, `router.js`) are generated files. Don't hand-edit them —
edit the source and rebuild.

## To change page copy
Edit the matching file in `build/pages/` (`home.html` = Approach, plus
`services.html`, `studio.html`, `contact.html`). Each file is just the
`<section class="content-section">...</section>` for that page.

## To change the header, hero video, or footer
Edit `build/template.html`. It's shared by every page.

## To change a page's title, meta description, or URL
Edit `build/meta.json`.

## To rebuild
```
cd build
node build.js
```
No dependencies to install — plain Node.

## Deploying
Upload everything at the project root (`index.html`, `services/`, `studio/`,
`contact/`, `router.js`, `styles.css`, `robots.txt`, `sitemap.xml`, and your
existing `images/` folder) to your host as-is. Your host needs to serve
`index.html` for a folder path like `/services/` — every mainstream static
host (Netlify, Vercel, GitHub Pages, S3+CloudFront, Apache, Nginx) does this
by default.
