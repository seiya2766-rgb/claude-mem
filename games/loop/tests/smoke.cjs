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

    for (const bt of ['boss', 'queen', 'reverser', 'warden', 'brood', 'phantom', 'glitch', 'colossus', 'conductor']) {
      const r = await p.evaluate(bt => {
        const W = window.__g;
        document.getElementById('overlay').hidden = true;
        W.enterNode(8, 'boss');
        const G = W.G;
        G.life = G.maxLife;
        for (let l = 0; l < 4; l++) for (let s = 0; s < 8; s++) {
          G.board[l][s] = { id: ['hat', 'snare', 'tom', 'hat', 'snare', 'lead', 'rest', 'tom'][s], uid: 9e5 + l * 8 + s, p: null, lv: 2 };
        }
        G.plan = [{ t: 1, type: bt, lane: 1 }];
        W.startStage();
        const dirs = new Set();
        let t = 0, rows = false;
        while (W.G.phase === 'play' && t < 120) { W.update(0.05); t += 0.05; dirs.add(W.G.dir); if (W.G.mutedRow >= 0) rows = true; }
        return { phase: W.G.phase, dirs: [...dirs], rows };
      }, bt);
      check(`boss "${bt}" can be beaten (win screen shows)`, r.phase === 'win', JSON.stringify(r));
      if (bt === 'reverser') check('The Reverser flips the playhead', r.dirs.includes(-1));
      if (bt === 'warden') check('The Warden seals a row', r.rows);
    }

    // Endless: from the boss win screen, keep going; an endless boss gives rewards instead of ending the run.
    await p.click('#endlessBtn');
    await p.waitForTimeout(80);
    const endlessRoute = await p.$$eval('[data-n]', e => e.map(x => x.dataset.n));
    check('endless continues past the boss', endlessRoute.length > 0 && !endlessRoute.includes('boss'), endlessRoute.join(','));
    const eb = await p.evaluate(() => {
      const W = window.__g; document.getElementById('overlay').hidden = true;
      W.enterNode(13, 'boss'); W.G.life = W.G.maxLife; W.G.plan = [{ t: 1, type: 'brood', lane: 1 }]; W.startStage();
      let t = 0; while (W.G.phase === 'play' && t < 150) { W.update(0.05); t += 0.05; }
      return { phase: W.G.phase, offers: document.querySelectorAll('#offers [data-id]').length };
    });
    check('an endless boss gives a reward and the run goes on', eb.phase === 'reward' && eb.offers > 0, JSON.stringify(eb));
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

  // v2.0 tiles, enemies and the codex
  {
    const { ctx, page: p } = await open(browser);
    await p.click('#go'); await p.waitForTimeout(100);
    const r = await p.evaluate(() => {
      const W = window.__g, G = W.G, out = {};
      const empty = () => Array.from({ length: 4 }, () => Array(8).fill(null));
      const setup = (cells, enemies) => {
        G.board = empty(); let u = 9e6;
        for (const [l, s, id] of cells) G.board[l][s] = { id, uid: u++, p: null, lv: 1 };
        G.plan = []; W.startStage(); G.enemies = [];
        for (const [type, lane, x] of enemies) { G.enemies.push({ type, lane, x, revealed: false, hp: 50, max: 50, speed: 0, dmg: 1, armor: type === 'block' ? 1 : 0, r: 8, shape: 'circle', slow: 0, flash: 0 }); }
      };
      const runTo = step => { G.step = step - 1; G.stepCount = 40; W.doStep(); };
      const hpAt = l => G.enemies.filter(e => e.lane === l).map(e => 50 - e.hp);
      setup([[0, 0, 'clap'], [1, 0, 'kick']], [['dot', 0, .5]]); runTo(0); out.clap = hpAt(0)[0];
      setup([[0, 0, 'rim']], [['block', 0, .5]]); runTo(0); out.rim = [hpAt(0)[0], G.enemies[0].armor];
      setup([[0, 0, 'drop']], [['dot', 0, .5], ['dot', 3, .5]]); runTo(0); out.drop = [hpAt(0)[0], hpAt(3)[0]];
      setup([[0, 1, 'choir'], [1, 3, 'chord'], [2, 2, 'pad']], [['dot', 0, .5]]); runTo(1); out.choir = hpAt(0)[0];
      setup([[0, 0, 'stab']], [['dot', 0, .4], ['dot', 0, .6], ['dot', 0, .8]]); runTo(0); out.stab = hpAt(0);
      setup([[0, 0, 'scratch']], [['dot', 0, .5]]); runTo(0); out.scratch = G.enemies[0].x;
      setup([], []); W.spawn('hopper', 1, .5); W.spawn('healer', 2, .5); W.spawn('dot', 2, .6);
      for (const e of G.enemies) { e.speed = 0; e.hp = e.max = 50; } G.enemies[2].hp = 40; G.stepCount = 3; G.step = 2; W.doStep();
      out.hop = G.enemies[0].lane; out.heal = G.enemies[2].hp;
      return out;
    });
    check('clap doubles with another drum on the beat', r.clap === 5, r.clap);
    check('rimshot strips armor', r.rim[1] === 0 && r.rim[0] >= 2, JSON.stringify(r.rim));
    check('drop hits every lane on beat 1', r.drop[0] === 4 && r.drop[1] === 4, JSON.stringify(r.drop));
    check('choir grows with harmony tiles', r.choir === 4, r.choir);
    check('stab hits the first two enemies', JSON.stringify(r.stab) === '[3,3,0]', JSON.stringify(r.stab));
    check('scratch pushes back', r.scratch > .55, r.scratch);
    check('hopper changes lane, healer heals', r.hop !== 1 && r.heal === 43, JSON.stringify([r.hop, r.heal]));
    await p.evaluate(() => window.__g.G.phase = 'menu'); await p.reload(); await p.waitForTimeout(300);
    await p.click('#cxBtn'); await p.click('[data-cx="enemies"]');
    const seen = await p.$$eval('.cx-list .cx.got', els => els.length);
    check('codex opens and lists met enemies', seen >= 2, `${seen} enemies`);
    check('no page errors with the new content', p.errors.length === 0, p.errors.join(' | '));
    await ctx.close();
  }

  // v2.1 pedals
  {
    const { ctx, page: p } = await open(browser);
    await p.click('#go'); await p.waitForTimeout(100);
    const r = await p.evaluate(() => {
      const W = window.__g, G = W.G;
      const trial = (relics, cells, step, noise = 0) => {
        G.board = Array.from({ length: 4 }, () => Array(8).fill(null)); let u = 7e6;
        for (const [l, s, id] of cells) G.board[l][s] = { id, uid: u++, p: null, lv: 1 };
        G.relics = relics; G.plan = []; W.startStage(); G.enemies = [];
        for (let l = 0; l < 4; l++) { W.spawn('dot', l, .5); }
        for (const e of G.enemies) { e.hp = e.max = 50; e.speed = 0; }
        G.noise = noise; G.step = step - 1; G.stepCount = 40; W.doStep();
        return { dmg: G.enemies.map(e => 50 - e.hp), slow: G.enemies.map(e => e.slow > 0), groove: G.groove };
      };
      return {
        eq: [trial({}, [[0, 0, 'drop']], 0).dmg[0], trial({ eq: true }, [[0, 0, 'drop']], 0).dmg[0]],
        offbeat: [trial({ offbeat: true }, [[0, 1, 'snare']], 1).dmg[0], trial({ offbeat: true }, [[0, 0, 'snare']], 0).dmg[0]],
        bit: [trial({ bitcrusher: true }, [[0, 0, 'dist']], 0, 0).dmg[0], trial({ bitcrusher: true }, [[0, 0, 'dist']], 0, 20).dmg[0]],
        stereo: trial({ stereo: true }, [[0, 0, 'stab']], 0).dmg[1],
        sustain: trial({ sustain: true }, [[2, 0, 'chord']], 0).slow[2],
        crowd: [trial({}, [[0, 0, 'snare']], 0).groove, trial({ crowd: true }, [[0, 0, 'snare']], 0).groove],
      };
    });
    check('EQ doubles bass tiles', r.eq[1] === r.eq[0] * 2, JSON.stringify(r.eq));
    check('Offbeat boosts even beats only', r.offbeat[0] === 4 && r.offbeat[1] === 3, JSON.stringify(r.offbeat));
    check('Bitcrusher boosts when noise is high', r.bit[1] > r.bit[0], JSON.stringify(r.bit));
    check('Stereo hits the next lane', r.stereo === 2, r.stereo);
    check('Sustain slows the lane', r.sustain === true);
    check('Crowd fills groove faster', r.crowd[1] > r.crowd[0], JSON.stringify(r.crowd));
    check('no page errors with the new pedals', p.errors.length === 0, p.errors.join(' | '));
    await ctx.close();
  }

  // v2.9 stage backdrops
  {
    const { ctx, page: p } = await open(browser);
    await p.click('#go'); await p.waitForTimeout(100);
    const seq = await p.evaluate(() => { const W = window.__g, G = W.G, out = [];
      for (const [col, node, endless] of [[0, 'battle'], [4, 'elite'], [7, 'battle'], [8, 'boss'], [9, 'battle', true], [10, 'shop', true]]) { G.col = col; G.node = node; G.endless = !!endless; out.push(W.stageTheme()); }
      return out.join(','); });
    check('backdrop changes with the stage', seq === 'dusk,night,rain,crimson,dawn,dusk', seq);
    const recs = await p.evaluate(() => { const W = window.__g, G = W.G, out = []; G.scale = 'dark';
      for (const [col, node, endless] of [[0, 'battle'], [4, 'battle'], [7, 'battle'], [8, 'boss'], [9, 'battle', true], [4, 'elite']]) { G.col = col; G.node = node; G.endless = !!endless; out.push(W.recommendBgm()); }
      return out.join(','); });
    check('BGM suggestion follows the backdrop', recs === 'dawn,neon,rainy,clash,dawn,neon', recs);
    const elite = await p.evaluate(() => { const W = window.__g, G = W.G; G.col = 4; G.node = 'elite'; G.endless = false; return W.bgmPool().join(','); });
    check('elite stages offer Storm', elite.includes('storm'), elite);
    await p.waitForTimeout(400);
    check('no page errors with the backdrops', p.errors.length === 0, p.errors.join(' | '));
    await ctx.close();
  }

  // v3.5 game feel: combo count and the boss finale
  {
    const { ctx, page: p } = await open(browser);
    await p.click('#go'); await p.waitForTimeout(100);
    const r = await p.evaluate(() => { const W = window.__g, G = W.G;
      G.board = Array.from({ length: 4 }, () => Array(8).fill(null));
      for (let s = 0; s < 8; s++) G.board[1][s] = { id: 'lead', uid: 7e6 + s, p: null, lv: 1 };
      G.plan = [{ t: 99, type: 'dot', lane: 0 }]; W.startStage(); G.enemies = [];
      for (let i = 0; i < 4; i++) W.spawn('dot', 1, .3 + i * .1); for (const e of G.enemies) { e.hp = e.max = 1; e.speed = 0; }
      G.step = -1; W.doStep(); const combo = G.combo;
      G.node = 'boss'; G.plan = [{ t: 99, type: 'dot', lane: 0 }]; W.startStage(); G.enemies = [];
      W.spawn('queen', 1, .7); W.spawn('dot', 0, .6); W.spawn('block', 3, .5); for (const e of G.enemies) e.speed = 0; G.enemies[0].hp = 1;
      G.step = -1; W.doStep(); const finale = G.finale > 0;
      for (let k = 0; k < 10; k++) W.update(.05); const left = G.enemies.length;
      for (let k = 0; k < 40 && G.phase === 'play'; k++) W.update(.05);
      return { combo, finale, left, phase: G.phase }; });
    check('kills in one beat count as a combo', r.combo === 4, r.combo);
    check('defeating the boss clears the field after a finale', r.finale && r.left === 0 && r.phase !== 'play', JSON.stringify(r));
    check('no page errors with the game-feel effects', p.errors.length === 0, p.errors.join(' | '));
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
