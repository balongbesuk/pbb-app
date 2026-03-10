#!/usr/bin/env node
/**
 * axe-audit-detail.js — Versi detail: tampilkan elemen HTML lengkap per violation
 * Jalankan: node scripts/axe-audit-detail.js
 */

const puppeteer = require("puppeteer");
const { default: AxePuppeteer } = require("@axe-core/puppeteer");

const BASE_URL = "http://localhost:3000";

// Hanya audit 1 halaman dulu untuk detail lengkap
const PAGE = { name: "Dashboard", path: "/" };

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`${BASE_URL}${PAGE.path}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 2000));

  const results = await new AxePuppeteer(page)
    .options({
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    })
    .analyze();

  console.log(`\n=== ${results.violations.length} VIOLATIONS on ${PAGE.name} ===\n`);

  for (const v of results.violations) {
    console.log(`[${v.impact?.toUpperCase()}] ID: ${v.id}`);
    console.log(`  Description: ${v.description}`);
    console.log(`  Help URL: ${v.helpUrl}`);
    console.log(`  Affected nodes (${v.nodes.length}):`);
    for (const n of v.nodes) {
      console.log(`    HTML: ${n.html.slice(0, 200)}`);
      const msgs = [
        ...(n.any || []),
        ...(n.all || []),
        ...(n.none || []),
      ].map((c) => c.message).filter(Boolean);
      for (const m of msgs) console.log(`      → ${m}`);
    }
    console.log();
  }

  console.log(`\n=== ${results.passes.length} PASSES ===`);
  for (const p of results.passes.slice(0, 5)) {
    console.log(`  ✅ ${p.id}: ${p.description}`);
  }

  await browser.close();
}

main();
