// Gera os ícones PNG do PWA GeriUpdates a partir de um SVG, via Chromium headless.
// Uso: node scripts/gerar-icones.mjs  (requer playwright-core + Chromium instalado)
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const TAMANHOS = [
  { arquivo: "gu-180.png", px: 180 },
  { arquivo: "gu-192.png", px: 192 },
  { arquivo: "gu-512.png", px: 512 },
];

// Fundo cheio (safe zone p/ maskable) com as cores da marca GeriClass.
const svg = (px) => `<!doctype html><meta charset="utf-8"><body style="margin:0">
<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e6349"/>
      <stop offset="1" stop-color="#123c2d"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#g)"/>
  <text x="50" y="52" text-anchor="middle" dominant-baseline="central"
    font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="40" fill="#ffffff">GU</text>
  <text x="50" y="78" text-anchor="middle" dominant-baseline="central"
    font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="11" fill="#dcefe6">updates</text>
</svg></body>`;

const executablePath = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
const browser = await chromium.launch({ executablePath });
await mkdir(new URL("../public/icons/", import.meta.url), { recursive: true });

for (const { arquivo, px } of TAMANHOS) {
  const page = await browser.newPage({ viewport: { width: px, height: px } });
  await page.setContent(svg(px));
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: px, height: px } });
  await writeFile(new URL(`../public/icons/${arquivo}`, import.meta.url), png);
  await page.close();
  console.log(`✓ public/icons/${arquivo}`);
}

await browser.close();
