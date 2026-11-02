// Safari-engine mobile QA: Free Practice tool dialogs must preserve the running Player.
import { webkit } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
const url = process.env.APP_URL || 'http://127.0.0.1:5174';
const dir = join(process.cwd(), 'docs/screenshots/class-demo-p02-webkit');
mkdirSync(dir, { recursive: true });
const must = (ok, message) => { if (!ok) throw new Error(message); };
const asSeconds = text => text.trim().split(':').map(Number).reduce((a,b) => a*60+b,0);
const browser = await webkit.launch({ headless: true });
try {
  for (const [width,height] of [[390,844],[375,667]]) {
    const context = await browser.newContext({ viewport: {width,height}, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(url+'/practice', {waitUntil: 'networkidle'});
    await page.getByRole('button', {name: /^Free Practice/}).click();
    await page.waitForURL(u=>u.pathname==='/player');
    await page.getByRole('button',{name:'Start practice timer'}).click();
    await page.waitForTimeout(1100);
    const clock=page.locator('[data-testid="session-elapsed"]');
    const before=asSeconds(await clock.innerText());
    await page.locator('.practice-utility-row').getByRole('button',{name:/Tuner/}).click();
    await page.getByRole('dialog',{name:'Tuner within practice'}).waitFor();
    must(new URL(page.url()).pathname==='/player', 'WebKit navigated away from Player for Tuner');
    must(await page.getByRole('dialog').getByText('No pitch detected').isVisible(), 'Tuner overlay did not render');
    await page.waitForTimeout(1150);
    must(asSeconds(await clock.innerText())>before, 'WebKit timer stopped in Tuner');
    await page.screenshot({path:join(dir,'tuner-webkit-'+width+'x'+height+'.png')});
    await page.getByRole('dialog').getByRole('button',{name:'Close tool and return to session'}).click();
    must(await page.getByRole('dialog').count()===0, 'Tuner close failed');
    must(await page.getByRole('button',{name:'Pause practice timer'}).isVisible(), 'Timer stopped on close');
    await page.locator('.practice-utility-row').getByRole('button',{name:/Metronome/}).click();
    await page.getByRole('dialog',{name:'Metronome within practice'}).waitFor();
    must(new URL(page.url()).pathname==='/player', 'WebKit navigated away for Metronome');
    await page.getByRole('dialog').getByRole('button',{name:'Increase tempo by 1 BPM'}).click();
    must(await page.locator('.metronome-bpm strong').innerText()==='101','WebKit metronome button failed');
    await page.screenshot({path:join(dir,'metronome-webkit-'+width+'x'+height+'.png')});
    await page.keyboard.press('Escape');
    must(await page.getByRole('dialog').count()===0, 'WebKit Escape close failed');
    await page.getByRole('button',{name:'Pause practice timer'}).click();
    const paused=asSeconds(await clock.innerText());
    await page.waitForTimeout(1100);
    must(asSeconds(await clock.innerText())===paused, 'WebKit paused timer advanced');
    await page.goto(url+'/routines',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Open Daily Jazz Warm-Up in player'}).click();
    must(await page.locator('.practice-utility-row').count()===1, 'WebKit Guided Practice missing tools');
    await page.locator('.practice-utility-row').getByRole('button', {name:/Tuner/}).click();
    await page.getByRole('dialog',{name:'Tuner within practice'}).waitFor();
    await page.getByRole('dialog').getByRole('button',{name:'Close tool and return to session'}).click();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    must(overflow<=1,'WebKit horizontal overflow: '+overflow);
    must(errors.length===0,'WebKit exceptions: '+errors.join(' | '));
    console.log('PASS WebKit P02 overlays '+width+'x'+height+': route and timer preserved, tuner/metronome close, guided controls present');
    await context.close();
  }
} finally { await browser.close(); }
