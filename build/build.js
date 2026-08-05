#!/usr/bin/env node
/**
 * build.js — assembles the static site from one shared template + per-page
 * content fragments + per-page SEO metadata.
 *
 * Usage:
 *   node build.js
 *
 * Edit these, then rebuild:
 *   - build/template.html      shared header / hero / footer / script shell
 *   - build/pages/*.html       the content for one page (just the <section>)
 *   - build/meta.json          title / description / canonical / output path per page
 *
 * Output is written flat to the project root (one level up from build/), e.g.
 *   ../index.html
 *   ../approach.html
 *   ../services.html
 *   ../studio.html
 *   ../contact.html
 *
 * router.js is copied to the root unchanged — it's not templated.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD = __dirname;

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function fill(template, values) {
  let out = template;
  for (const [key, value] of Object.entries(values)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function build() {
  const template = readFile(path.join(BUILD, 'template.html'));
  const meta = JSON.parse(readFile(path.join(BUILD, 'meta.json')));

  meta.forEach(page => {
    const content = readFile(path.join(BUILD, page.contentFile));
    const html = fill(template, {
      TITLE: page.title,
      DESCRIPTION: page.description,
      CANONICAL: page.canonical,
      OPEN_CLASS: page.openClass,
      SECTION_ID: page.section,
      CONTENT: content
    });
    const outPath = path.join(ROOT, page.outputPath);
    ensureDir(outPath);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log('wrote', path.relative(ROOT, outPath));
  });

  // router.js is a plain static asset — copy it as-is to the site root
  const routerSrc = path.join(BUILD, 'router.js');
  const routerDest = path.join(ROOT, 'router.js');
  fs.copyFileSync(routerSrc, routerDest);
  console.log('wrote', path.relative(ROOT, routerDest));
}

build();
