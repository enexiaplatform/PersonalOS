/** Local synthetic QA: drafts survive passive refreshes; AI modal owns focus. */
import assert from 'node:assert/strict';
import {monday} from '../../apps/personal-os-v1/calendar.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const week={week_start:monday(),synced_at:new Date().toISOString(),tasks:[{id:'fixture-task',title:'Local synthetic task',group:'Personal',date:monday(),status:'plan'}]};
await page.route('**/supabase-client.mjs',route=>route.fulfill({contentType:'text/javascript',body:`
 const week=${JSON.stringify(week)};
 export const client={auth:{onAuthStateChange(){},async getSession(){return {data:{session:{access_token:'local-fixture',user:{id:'fixture'}}}}}},
 from(table){return {select(){return this},eq(){return this},order(){return this},limit(){return this},async maybeSingle(){return {data:null}},then(resolve){return Promise.resolve({data:table==='personal_os_calendar_weeks'?[week]:[]}).then(resolve)}}}};
`}));
await page.route('**/api/ai-manager*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,runs:[],actions:[],memory:{core:[],working:[],sources:[],decisions:[],events:[]}})}));
try{
 await page.goto(base+'/#personal/weekly');
 const wins=page.locator('#weekly-form textarea[name=wins]');
 await wins.fill('Local synthetic draft that must survive a tab return');
 await page.locator('#view-content h1').click();
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 // Wait past a completed async refresh, which previously replaced the draft.
 await page.waitForTimeout(150);
 assert.equal(await wins.inputValue(),'Local synthetic draft that must survive a tab return');
 await page.locator('#nav [data-view=calendar]').click();
 await page.locator('.cal-agenda [data-cal-task]').click();
 const title=page.locator('.cal-dialog input[name=title]');
 await title.fill('Local synthetic calendar edit');
 await page.locator('.cal-dialog h2').click();
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await page.waitForTimeout(150);
 assert.equal(await page.locator('.cal-dialog').first().evaluate(el=>el.open),true);
 assert.equal(await title.inputValue(),'Local synthetic calendar edit');
 await page.keyboard.press('Escape');
 await page.locator('#nav [data-view=review]').click();
 const launch=page.locator('.aom-launch');
 await launch.click();
 assert.equal(await page.locator('dialog.aom-overlay').evaluate(el=>el.matches(':modal')),true);
 await page.locator('#nav [data-view=calendar]').evaluate(el=>el.focus());
 assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('.aom-overlay'))),true);
 await page.keyboard.press('Control+k');
 assert.equal(await page.locator('#command-dialog').evaluate(el=>el.open),false);
 await page.locator('.aom-tabs [role=tab]').first().focus();
 await page.keyboard.press('End');
 assert.equal(await page.locator('.aom-tabs [data-tab=settings]').getAttribute('aria-selected'),'true');
 assert.equal(await page.locator('#aom-tab-settings').count(),1);
 assert.equal(await page.locator('.aom-compose-foot [data-tab=settings]').getAttribute('aria-selected'),null);
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  const brand=await page.locator('.aom-brand').boundingBox();
  const actions=await page.locator('.aom-header-actions').boundingBox();
  assert(actions.y>=brand.y+brand.height,'AI actions must sit below the title at mobile widths');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('dialog.aom-overlay').evaluate(el=>el.open),false);
 assert.equal(await launch.evaluate(el=>el===document.activeElement),true);
 assert.deepEqual(errors,[]);
 console.log('PASS: review/calendar draft continuity, native AI modality, focus return, shortcut isolation, tab semantics and mobile header.');
}finally{await browser.close();}
