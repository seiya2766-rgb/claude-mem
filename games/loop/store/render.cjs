// Renders Steam store art and screenshots into store/out/.
// Run from games/loop:  node store/render.cjs   (needs Playwright with Chromium)
// Capsule sizes follow Steamworks' current graphical asset rules; check them again before uploading.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const CAPSULE = 'file://' + path.join(__dirname, 'capsule.html');
const GAME = 'file://' + path.resolve(__dirname, '..', 'prototype.html');
fs.mkdirSync(OUT, { recursive: true });

const CAPSULES = [
  { file: 'header_capsule_920x430.png', w: 920, h: 430 },
  { file: 'small_capsule_462x174.png', w: 462, h: 174 },
  { file: 'main_capsule_1232x706.png', w: 1232, h: 706, tag: 'DEFEND WITH YOUR SONG' },
  { file: 'vertical_capsule_748x896.png', w: 748, h: 896, tag: 'DEFEND WITH YOUR SONG' },
  { file: 'library_capsule_600x900.png', w: 600, h: 900 },
  { file: 'library_hero_3840x1240.png', w: 3840, h: 1240, logo: 0 },
  { file: 'library_logo_1280x720.png', w: 1280, h: 720, bg: 0 },
];

(async () => {
  const browser = await chromium.launch();

  for (const c of CAPSULES) {
    const page = await browser.newPage({ viewport: { width: c.w, height: c.h } });
    const qs = new URLSearchParams({ w: c.w, h: c.h, ...(c.tag ? { tag: c.tag } : {}), ...(c.logo === 0 ? { logo: 0 } : {}), ...(c.bg === 0 ? { bg: 0 } : {}) });
    await page.goto(`${CAPSULE}?${qs}`);
    await page.waitForTimeout(800);
    await page.locator('#c').screenshot({ path: path.join(OUT, c.file), omitBackground: c.bg === 0 });
    await page.close();
    console.log('wrote', c.file);
  }

  // In-game screenshots, 1920x1080, dark theme, English UI.
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, colorScheme: 'dark', locale: 'en-US' });
  const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, name) }); console.log('wrote', name); };
  const BOARD = [
    ['kick', null, 'hat', null, 'kick', 'hat', null, 'hat'],
    [null, 'snare', null, 'lead', null, 'snare', 'chord', null],
    ['bass', null, 'chord', null, 'bass', null, 'lead', 'bass'],
    [null, 'pad', null, 'echo', null, 'dist', 'rest', 'pad'],
  ];
  const stage = async (page, extra) => page.evaluate(({ BOARD, extra }) => {
    const W = window.__g, G = W.G;
    G.board = BOARD.map((row, l) => row.map((id, s) => id ? { id, uid: 1e6 + l * 8 + s, p: null, lv: (l + s) % 5 === 0 ? 2 : 1 } : null));
    G.hand = ['tom', 'arp', 'snare'].map((id, i) => ({ id, uid: 2e6 + i, p: null, lv: 1 }));
    G.relics = { sidechain: true, chorus: true };
    if (extra === 'boss') { document.getElementById('overlay').hidden = true; W.enterNode(8, 'boss'); G.plan = [{ t: .5, type: 'phantom', lane: 1 }, { t: 2, type: 'dot', lane: 0 }, { t: 3, type: 'shield', lane: 2 }]; }
    else { document.getElementById('overlay').hidden = true; W.enterNode(5, 'elite'); }
    W.startStage();
  }, { BOARD, extra });

  // Pre-unlock achievements so no pop-up covers the screenshots.
  await ctx.addInitScript(() => localStorage.setItem('loop.ach', JSON.stringify(['first_win', 'elite', 'upgrade', 'composer', 'big_hit', 'clear', 'fever', 'daily_clear'])));
  let page = await ctx.newPage();
  await page.goto(GAME); await page.waitForTimeout(1200);
  await shot(page, 'screenshot_1_title.png');
  await page.click('#go'); await page.waitForTimeout(200);

  await stage(page, 'battle');
  await page.waitForTimeout(6500);
  await page.evaluate(() => { window.__g.G.groove = 99; });
  await page.waitForTimeout(1600);
  await shot(page, 'screenshot_2_battle.png');

  await stage(page, 'boss');
  await page.waitForTimeout(900);
  await shot(page, 'screenshot_3_boss.png');

  await page.evaluate(() => { const W = window.__g; W.G.phase = 'play'; W.G.enemies = []; W.G.spawnIdx = W.G.spawns.length; W.G.node = 'battle'; W.update(0.05); });
  await page.waitForTimeout(300);
  const offer = await page.$('#offers [data-id]'); if (offer) await offer.click();
  await page.waitForTimeout(300);
  await shot(page, 'screenshot_4_route.png');
  await page.close();

  page = await ctx.newPage();
  await page.goto(GAME); await page.waitForTimeout(600);
  await page.click('#stBtn'); await page.waitForTimeout(200);
  await page.evaluate(({ BOARD }) => { const G = window.__g.G; G.board = BOARD.map((row, l) => row.map((id, s) => id ? { id, uid: 3e6 + l * 8 + s, p: (l * 3 + s) % 7, lv: 1 } : null)); G.scale = 'miyako'; G.root = 2; }, { BOARD });
  await page.click('#playBtn'); await page.waitForTimeout(1500);
  await page.click('.cell[data-l="1"][data-s="3"]'); await page.waitForTimeout(400);
  await shot(page, 'screenshot_5_studio.png');

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
