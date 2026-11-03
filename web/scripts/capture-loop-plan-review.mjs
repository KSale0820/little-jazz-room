// Actual mobile screenshots of the PR #27 multi-section looping panel.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base=process.env.APP_URL ?? 'http://127.0.0.1:5174';
const out=join(process.cwd(),'docs/screenshots/p02-repeat-plan-review');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const check=(v,m)=>{if(!v)throw Error(m)};
try {
  for(const [width,height] of [[390,844],[375,667]]) {
    const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page=await ctx.newPage();
    page.setDefaultTimeout(15000);
    const name=(suffix)=>join(out,'P02-'+suffix+'-'+width+'x'+height+'.png');
    await page.goto(base+'/practice',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:/^Free Practice/}).click();
    await page.waitForURL(u=>u.pathname==='/player');
    await page.getByRole('combobox',{name:'Choose practice chart'}).selectOption('rhythm-bb-32');
    await page.locator('.practice-utility-row').getByRole('button',{name:'Loop'}).click();
    const sheet=page.getByRole('dialog',{name:'Set up looping'});
    await sheet.waitFor();
    check(await sheet.getByRole('button',{name:/No looping/}).getAttribute('aria-pressed')==='true','Default no-looping unavailable');
    await page.screenshot({path:name('no-looping-panel'),animations:'disabled'});

    await sheet.getByRole('button',{name:/Repeat sections/}).click();
    await sheet.getByRole('spinbutton',{name:'Section 1 play count'}).fill('3');
    await sheet.getByRole('spinbutton',{name:'Section 1 play count'}).blur();
    await sheet.getByRole('button',{name:'+ Add section'}).click();
    const bar=async (label,value)=>{
      const input=sheet.getByRole('spinbutton',{name:label});
      await input.fill(String(value)); await input.blur();
    };
    await bar('Section 2 start bar',9);
    await bar('Section 2 end bar',12);
    await bar('Section 2 play count',2);
    check(await sheet.getByRole('spinbutton',{name:'Section 1 play count'}).inputValue()==='3','First pass count missing');
    check(await sheet.getByRole('spinbutton',{name:'Section 2 start bar'}).inputValue()==='9','Second start missing');
    check(await sheet.getByRole('spinbutton',{name:'Section 2 end bar'}).inputValue()==='12','Second end missing');
    check(await sheet.getByRole('spinbutton',{name:'Section 2 play count'}).inputValue()==='2','Second pass count missing');
    await sheet.evaluate(el=>{el.scrollTop=0});
    await page.screenshot({path:name('two-sections-top'),animations:'disabled'});
    await sheet.evaluate(el=>{el.scrollTop=el.scrollHeight});
    await page.screenshot({path:name('two-sections-bottom'),animations:'disabled'});

    await sheet.getByRole('button',{name:'+ Add section'}).click();
    await bar('Section 3 start bar',17);
    await bar('Section 3 end bar',20);
    await bar('Section 3 play count',4);
    await sheet.evaluate(el=>{el.scrollTop=el.scrollHeight});
    await page.screenshot({path:name('three-sections-bottom'),animations:'disabled'});

    await sheet.getByRole('button',{name:'Remove section 3'}).click();
    await sheet.getByRole('button',{name:'Apply plan'}).click();
    check(await sheet.count()===0,'Apply did not close panel');
    check(await page.locator('.practice-utility-row').getByRole('button',{name:'Loop'}).getAttribute('aria-pressed')==='true','Applied plan was not enabled');
    await page.screenshot({path:name('two-sections-applied'),animations:'disabled'});
    console.log('PASS loop plan review screenshots '+width+'x'+height);
    await ctx.close();
  }
} finally {await browser.close();}
