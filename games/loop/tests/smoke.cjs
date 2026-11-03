// LOOP smoke tests: plays the prototype in headless Chromium and checks the flows that have broken before.
// Run from games/loop:  node tests/smoke.cjs
// Needs Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'file://' + path.resolve(__dirname, '..', 'prototype.html');
const results = [];
const check = (name, ok, info = '') => {
  results.push({ name, ok: !!ok, info });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
};

async function open(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'ja-JP', acceptDownloads: true, ...opts });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  await page.goto(URL);
  await page.waitForTimeout(300);
  return { ctx, page };
}

async function drag(p, from, to) {
  const a = await p.locator(from).boundingBox();
  const c = await p.locator(to).boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await p.mouse.down();
  await p.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2, { steps: 3 });
  await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2, { steps: 6 });
  await p.mouse.up();
  await p.waitForTimeout(80);
}

(async () => {
  const browser = await chromium.launch();

  // Start screen, layout, input, shop, bosses
  {
    const { ctx, page: p } = await open(browser);
    check('start screen shows', await p.isVisible('#go'));
    await p.click('#go');
    await p.waitForTimeout(150);
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    check('run fits 1280x720 without scrolling', h <= 720, `scrollHeight ${h}`);

    await drag(p, '#hand .chip:nth-child(1)', '.cell[data-l="1"][data-s="0"]');
    const placed = await p.evaluate(() => window.__g.G.board[1][0]?.id);
    check('drag a tile from hand to board', placed === 'kick', placed);

    await p.keyboard.press('e');
    await p.keyboard.press('ArrowRight');
    await p.keyboard.press('ArrowRight');
    await p.keyboard.press('Enter');
    check('keyboard places a tile', await p.evaluate(() => !!window.__g.G.board[1][2]));

    // Broke in v0.6: leaving the shop crashed the route screen.
    await p.evaluate(() => { window.__g.G.coins = 3; window.__g.enterNode(2, 'shop'); });
    await p.click('#leave');
    await p.waitForTimeout(80);
    check('leaving the shop shows the route choice', (await p.$$('[data-n]')).length > 0);

    for (const bt of ['boss', 'queen', 'reverser']) {
      const r = await p.evaluate(bt => {
        const W = window.__g;
        document.getElementById('overlay').hidden = true;
        W.enterNode(8, 'boss');
        const G = W.G;
        for (let l = 0; l < 4; l++) for (let s = 0; s < 8; s++) {
          G.board[l][s] = { id: ['snare', 'tom', 'lead', 'dist'][l], uid: 9e5 + l * 8 + s, p: null, lv: 2 };
        }
        G.plan = [{ t: 1, type: bt, lane: 1 }];
        W.startStage();
        const dirs = new Set();
        let t = 0;
        while (W.G.phase === 'play' && t < 120) { W.update(0.05); t += 0.05; dirs.add(W.G.dir); }
        return { phase: W.G.phase, dirs: [...dirs] };
      }, bt);
      check(`boss "${bt}" can be beaten (win screen shows)`, r.phase === 'win', JSON.stringify(r));
      if (bt === 'reverser') check('The Reverser flips the playhead', r.dirs.includes(-1));
    }
    check('no page errors during a run', p.errors.length === 0, p.errors.join(' | '));
    await ctx.close();
  }

  // Tutorial end to end
  {
    const { ctx, page: p } = await open(browser);
    await p.click('#tutBtn');
    await p.waitForTimeout(100);
    await p.click('#tutNext');
    await drag(p, '#hand .chip:has-text("スネア") >> nth=0', '.cell[data-l="1"][data-s="0"]');
    await drag(p, '#hand .chip:has-text("キック")', '.cell[data-l="0"][data-s="0"]');
    await drag(p, '#hand .chip:has-text("ベース")', '.cell[data-l="2"][data-s="2"]');
    if (await p.evaluate(() => window.__g.G.tutorial) === 3) await p.click('.cell[data-l="2"][data-s="2"]');
    await p.click('#tutNext');
    await p.click('#playBtn');
    await p.waitForTimeout(100);
    await p.evaluate(() => { const W = window.__g; let t = 0; while (W.G.stats.kills < 1 && t < 60) { W.update(0.05); t += 0.05; } });
    await p.waitForTimeout(80);
    await p.click('#tutNext');
    await p.evaluate(() => { const W = window.__g; let t = 0; while (W.G.phase === 'play' && t < 120) { W.update(0.05); t += 0.05; } });
    await p.waitForTimeout(100);
    check('tutorial reaches the completion screen', await p.isVisible('#tutPlay'));
    check('no page errors in the tutorial', p.errors.length === 0, p.errors.join(' | '));
    await ctx.close();
  }

  // Daily challenge is deterministic
  {
    const runs = [];
    for (let k = 0; k < 2; k++) {
      const { ctx, page: p } = await open(browser);
      await p.click('#dailyBtn');
      await p.waitForTimeout(100);
      runs.push(await p.evaluate(() => {
        const W = window.__g, G = W.G;
        G.hand.forEach((t, i) => { G.board[i % 4][(i * 3) % 8] = t; });
        G.hand = [];
        W.startStage();
        let t = 0;
        while (W.G.phase === 'play' && t < 200) { W.update(0.05); t += 0.05; }
        return JSON.stringify([G.plan.map(o => o.type + o.lane), W.G.stats.kills, W.G.life]);
      }));
      await ctx.close();
    }
    check('daily challenge plays out the same twice', runs[0] === runs[1]);
  }

  // Save and continue
  {
    const { ctx, page: p } = await open(browser);
    await p.click('#go');
    await p.waitForTimeout(100);
    await p.evaluate(() => { const W = window.__g; W.G.phase = 'play'; W.G.enemies = []; W.G.spawnIdx = W.G.spawns.length; W.update(0.05); });
    await p.click('#offers [data-id]');
    await p.waitForTimeout(80);
    await p.reload();
    await p.waitForTimeout(300);
    const cont = await p.isVisible('#cont');
    if (cont) { await p.click('#cont'); await p.waitForTimeout(100); }
    check('a run can be continued after reloading', cont && (await p.$$('[data-n]')).length > 0);
    await ctx.close();
  }

  // Instrument set unlocks
  {
    const { ctx, page: p } = await open(browser);
    const lockedBefore = await p.isDisabled('.offer.locked >> nth=0');
    await p.evaluate(() => localStorage.setItem('loop.clears', '1'));
    await p.reload();
    await p.waitForTimeout(300);
    const perc = await p.$('[data-kit="percussion"]');
    check('new instrument sets start locked and unlock after a clear', lockedBefore && !!perc);
    await ctx.close();
  }

  // Studio and WAV export
  {
    const { ctx, page: p } = await open(browser);
    await p.click('#stBtn');
    await p.waitForTimeout(100);
    for (let i = 0; i < 4; i++) {
      await p.click(`#hand .chip:nth-child(${i + 1})`);
      await p.click(`.cell[data-l="${i}"][data-s="${i * 2}"]`);
    }
    const dl = p.waitForEvent('download', { timeout: 15000 });
    await p.click('#stExport');
    const d = await dl;
    const head = fs.readFileSync(await d.path()).subarray(0, 12).toString('latin1');
    check('studio exports a WAV file', head.startsWith('RIFF') && head.endsWith('WAVE'), d.suggestedFilename());
    check('no page errors in the studio', p.errors.length === 0, p.errors.join(' | '));
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
