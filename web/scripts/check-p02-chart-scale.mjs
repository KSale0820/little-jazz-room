// All notes on one screen: no score tabs, no clipped measures, on both phones.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const url = process.env.APP_URL || 'http://127.0.0.1:5174';
const dir = join(process.cwd(), 'docs/screenshots/class-demo-p02-chart-scale');
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const check = (ok, reason) => { if (!ok) throw Error(reason); };
try {
  for (const [width,height] of [[390,844],[375,667]]) {
    const ctx = await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    page.setDefaultTimeout(12000);
    const assess = async (bars, label) => {
      const g = await page.evaluate(() => {
        const chart=document.querySelector('.practice-chart-scroll.practice-chart-all');
        const grid=chart?.querySelector('.chord-grid');
        const tools=document.querySelector('.practice-utility-row');
        if (!chart||!grid||!tools) throw Error('Missing chart or tool dock');
        const rect=x=>{const r=x.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};
        const chords=[...grid.querySelectorAll('.chords span')];
        return {
          chart:rect(chart),grid:rect(grid),tools:rect(tools),
          bars:grid.querySelectorAll('.measure').length,
          cols:getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length,
          overflowY:getComputedStyle(chart).overflowY,
          docWidth:document.documentElement.scrollWidth,
          docHeight:document.documentElement.scrollHeight,
          chordFont:parseFloat(getComputedStyle(grid.querySelector('.chords')).fontSize),
          chordOverflow:chords.some(e=>e.scrollWidth>e.clientWidth+1),
          chordPairs:[...grid.querySelectorAll('.chords.two')].map(el=>{
            const spans=[...el.querySelectorAll('span')];
            const [a,b]=spans.map(x=>x.getBoundingClientRect());
            return {
              beat1:spans[0]?.dataset.beat,beat2:spans[1]?.dataset.beat,
              duration1:spans[0]?.dataset.durationBeats,duration2:spans[1]?.dataset.durationBeats,
              leftBeforeRight:a?.right<=b?.left+1,
              sameRow:Math.abs((a.top+a.bottom)/2-(b.top+b.bottom)/2)<2,
              noOverlap: a?.right<=b?.left+1,
              twoColumns:getComputedStyle(el).gridTemplateColumns.split(/\s+/).length===2,
            };
          }),
          gridRules: (() => {
            const cells=[...grid.querySelectorAll('.measure')];
            const style=el=>getComputedStyle(el);
            return {
              rowGap: parseFloat(style(grid).rowGap),
              top: parseFloat(style(cells[0]).borderTopWidth),
              left: parseFloat(style(cells[0]).borderLeftWidth),
              between: parseFloat(style(cells[1]).borderLeftWidth),
              right: parseFloat(style(cells[3]).borderRightWidth),
              bottom: parseFloat(style(cells[cells.length-1]).borderBottomWidth),
              section: parseFloat(style(cells[Math.min(8,cells.length-1)]).borderTopWidth),
            };
          })(),
        };
      });
      check(g.bars===bars,label+' missing bars '+JSON.stringify(g));
      check(g.cols===4,label+' not four measures per row');
      check(g.grid.height<=g.chart.height+2,label+' chart clipped');
      check(g.chart.bottom<=height+1,label+' chart extends below screen');
      // The app uses an internal mobile viewport scroller, not document-level scrolling.
      // Check actual reachability rather than comparing against document.scrollHeight.
      await page.locator('.practice-utility-row').scrollIntoViewIfNeeded();
      const toolBounds=await page.locator('.practice-utility-row').boundingBox();
      check(toolBounds && toolBounds.y >= -1 && toolBounds.y + toolBounds.height <= height+1,
        label+' tool dock is not reachable on mobile');
      await page.locator('.practice-chart-scroll').scrollIntoViewIfNeeded();
      check(g.docWidth<=width+1,label+' horizontal overflow');
      check(!g.chordOverflow,label+' chord text overflows cells');
      check(g.chordPairs.every(p=>p.twoColumns && p.leftBeforeRight && p.sameRow && p.noOverlap),
        label+' two-chord measures are stacked or overlap: '+JSON.stringify(g.chordPairs));
      if(bars===12) check(g.chordPairs.length===5 &&
        g.chordPairs.every(p=>p.beat1==='1' && p.duration1==='2' && p.beat2==='3' && p.duration2==='2'),
        label+' must preserve five real beat-1/beat-3 changes: '+JSON.stringify(g.chordPairs));
      check(g.gridRules.rowGap===0,label+' grid has separated rows, not full horizontal lines');
      check(g.gridRules.top>=1 && g.gridRules.left>=1 && g.gridRules.between>=1 &&
        g.gridRules.right>=1 && g.gridRules.bottom>=1,
        label+' missing full grid borders: '+JSON.stringify(g.gridRules));
      if(bars>16) check(g.gridRules.section>=2,label+' AABA section divider not visible');
      check(g.chordFont >= (bars>16?10:11),label+' unreadably small chords');
      check(await page.getByRole('navigation',{name:'Chart sections and measure groups'}).count()===0,label+' requires paging');
      return g;
    };
    await page.goto(url+'/practice',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:/^Free Practice/}).click();
    await page.waitForURL(u=>u.pathname==='/player');
    await page.getByRole('tab',{name:'Chart'}).click();
    const blues=await assess(12,'Free blues '+width+'x'+height);
    await page.screenshot({path:join(dir,'P02-free-complete-blues-'+width+'x'+height+'.png'),animations:'disabled'});
    await page.getByRole('combobox',{name:'Choose practice chart'}).selectOption('rhythm-bb-32');
    const aaba=await assess(32,'Free AABA '+width+'x'+height);
    check((await page.locator('.practice-chart-scroll .measure-section-label').allTextContents()).join(',')==='A,A,B,A','AABA form markers missing');
    check(await page.getByRole('button',{name:/^Measure 32:/}).count()===1,'Last A not rendered');
    check(await page.getByRole('button',{name:/^Measure 17:/}).count()===1,'Bridge not rendered');
    await page.screenshot({path:join(dir,'P02-free-complete-AABA-'+width+'x'+height+'.png'),animations:'disabled'});
    // A repeat plan has any number of sections, each with its own play count.
    await page.getByRole('button',{name:/^Off/}).click();
    const loopDialog=page.getByRole('dialog',{name:'Set up looping'});
    check(await loopDialog.isVisible(),'Loop setup did not open');
    check(await loopDialog.getByRole('button',{name:/No looping/}).getAttribute('aria-pressed')==='true',
      'No looping should be the default');
    await loopDialog.getByRole('button',{name:/Repeat sections/}).click();
    check(await loopDialog.getByRole('region',{name:'Section 1'}).count()===1,'First editable section missing');
    await loopDialog.getByRole('button',{name:'Increase section 1 play count'}).click();
    check(await loopDialog.getByRole('spinbutton',{name:'Section 1 play count'}).inputValue()==='3',
      'First section repeat count did not update');
    await loopDialog.getByRole('button',{name:'+ Add section'}).click();
    check(await loopDialog.getByRole('region',{name:'Section 2'}).count()===1,'Second section missing');
    await loopDialog.getByRole('spinbutton',{name:'Section 2 start bar'}).fill('17');
    await loopDialog.getByRole('spinbutton',{name:'Section 2 start bar'}).blur();
    await loopDialog.getByRole('spinbutton',{name:'Section 2 end bar'}).fill('24');
    await loopDialog.getByRole('spinbutton',{name:'Section 2 end bar'}).blur();
    check(await loopDialog.getByRole('spinbutton',{name:'Section 2 start bar'}).inputValue()==='17',
      'Direct bar entry failed');
    check(await loopDialog.getByRole('spinbutton',{name:'Section 2 end bar'}).inputValue()==='24',
      'Custom section end not saved');
    await loopDialog.getByRole('button',{name:'+ Add section'}).click();
    check(await loopDialog.getByRole('region',{name:'Section 3'}).count()===1,'Third section missing');
    await loopDialog.getByRole('button',{name:'Remove section 3'}).click();
    check(await loopDialog.getByRole('region',{name:'Section 3'}).count()===0,'Remove section failed');
    await loopDialog.getByRole('button',{name:/Repeat whole plan/}).click();
    check(await loopDialog.getByRole('button',{name:/Repeat whole plan/}).getAttribute('aria-pressed')==='true',
      'Continuous plan option did not enable');
    await loopDialog.getByRole('button',{name:/Repeat whole plan/}).click();
    const sheet=await loopDialog.boundingBox();
    check(sheet && sheet.width<=width+1 && sheet.y>=0,'Loop settings sheet exceeds viewport');
    await page.screenshot({path:join(dir,'P02-loop-settings-'+width+'x'+height+'.png'),animations:'disabled'});
    await loopDialog.getByRole('button',{name:'Apply plan'}).click();
    check(await page.getByRole('button',{name:/2 sections/}).isVisible(),'Two-section plan not applied');
    check(await page.locator('.measure.looped').count()===4,'First configured range not highlighted');
    await page.getByRole('button',{name:'Configure loop'}).click();
    await loopDialog.getByRole('button',{name:/No looping/}).click();
    await page.keyboard.press('Escape');
    check(await loopDialog.count()===0,'Escape did not close loop settings');
    check(await page.getByRole('button',{name:/2 sections/}).isVisible(),'Escape changed active plan');
    await page.getByRole('button',{name:'Configure loop'}).click();
    await loopDialog.getByRole('button',{name:/No looping/}).click();
    await loopDialog.getByRole('button',{name:'Apply plan'}).click();
    check(await page.getByRole('button',{name:/^Off/}).isVisible(),'No looping mode not applied');
    check(await page.locator('.measure.looped').count()===0,'No looping should clear active range');
    await page.getByRole('button',{name:/^Measure 8:/}).click();
    await page.getByRole('button',{name:'Next measure'}).click();
    check(await page.getByRole('button',{name:/^Measure 9:/}).getAttribute('aria-pressed')==='true','Measure transport failed');
    await page.getByRole('button',{name:'Start practice timer'}).click();
    await page.waitForTimeout(1150);
    check((await page.getByTestId('session-elapsed').innerText())!=='00:00','Session timer failed');
    await page.locator('.practice-utility-row').getByRole('button',{name:/Tuner/}).click();
    await page.getByRole('dialog',{name:'Tuner within practice'}).waitFor();
    await page.getByRole('dialog').getByRole('button',{name:'Close tool and return to session'}).click();
    check(await page.getByRole('button',{name:'Pause practice timer'}).isVisible(),'Overlay reset timer');
    await page.goto(url+'/routines',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Open Daily Jazz Warm-Up in player'}).click();
    await page.waitForURL(u=>u.pathname==='/player');
    const guided=await assess(12,'Guided blues '+width+'x'+height);
    check(await page.getByRole('button',{name:/^Measure 12:/}).count()===1,'Last guided measure not visible');
    await page.screenshot({path:join(dir,'P02-guided-complete-blues-'+width+'x'+height+'.png'),animations:'disabled'});
    check(errors.length===0,'Browser exceptions '+errors.join(' | '));
    results.push({width,height,blues,aaba,guided,status:'PASS'});
    console.log('PASS complete unpaged 12/32-bar charts and guided at '+width+'x'+height);
    await ctx.close();
  }
} finally {await browser.close();}
writeFileSync(join(dir,'chart-scale-results.json'),JSON.stringify(results,null,2));
