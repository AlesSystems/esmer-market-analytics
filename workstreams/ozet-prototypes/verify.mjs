import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const out='.impeccable/review/ozet';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const evidence={checks:[],errors:[]};
page.on('pageerror',error=>evidence.errors.push(error.message));
function check(name,pass,detail){evidence.checks.push({name,pass,detail});if(!pass)throw Error(name);}
await page.addInitScript(()=>{
 window.__drawCount=0;
 for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){
  const original=WebGL2RenderingContext.prototype[name];
  WebGL2RenderingContext.prototype[name]=function(...args){window.__drawCount++;return original.apply(this,args);};
 }
});
for(const variant of ['A','B','C']){
 for(const [name,width,height] of [['desktop',1440,1100],['narrow',680,1100],['mobile',390,1000]]){
  await page.setViewportSize({width,height});await page.goto(`http://127.0.0.1:4173/?variant=${variant}`);await page.waitForTimeout(900);
  if(!process.env.INTERACTIONS_ONLY)await page.screenshot({path:`${out}/${variant}-${name}.png`,fullPage:true});
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:!!document.querySelector('canvas')}));
  check(`${variant} ${name} fits`,dimensions.scroll===dimensions.width&&dimensions.canvas,dimensions);
 }
 await page.getByRole('button',{name:'Maliyet',exact:true}).click();
 check(`${variant} HTML selects cost`,await page.getByRole('button',{name:'Maliyet',exact:true}).getAttribute('aria-pressed')==='true');
 await page.getByRole('button',{name:'Gider',exact:true}).click();
 check(`${variant} expense feedback`,(await page.locator('.scene-caption').innerText()).includes('hesaplanamıyor'));
 await page.getByRole('button',{name:'Raporu incele',exact:true}).click();check(`${variant} details open`,await page.locator('dialog').isVisible());
 await page.keyboard.press('Escape');check(`${variant} escape restores focus`,await page.getByRole('button',{name:'Raporu incele',exact:true}).evaluate(el=>el===document.activeElement));
}
await page.setViewportSize({width:1440,height:1100});await page.goto('http://127.0.0.1:4173/?variant=A');await page.waitForTimeout(900);
await page.keyboard.press('ArrowRight');check('keyboard switch to B',page.url().includes('variant=B'));
await page.reload();check('reload preserves B',page.url().includes('variant=B'));
await page.getByRole('button',{name:'Sonraki tasarım'}).click();check('button switches C',page.url().includes('variant=C'));
await page.getByRole('button',{name:'Sonraki tasarım'}).click();check('wraps to A',page.url().includes('variant=A'));
await page.getByRole('button',{name:'Gider',exact:true}).click();
await page.waitForTimeout(500);
const canvas=page.locator('canvas');const rect=await canvas.boundingBox();await page.mouse.click(rect.x+rect.width*.51,rect.y+rect.height*.38);
await page.waitForFunction(()=>document.querySelector('.scene-tabs button')?.getAttribute('aria-pressed')==='true');
check('3D object click selects sales',await page.getByRole('button',{name:'Satış',exact:true}).getAttribute('aria-pressed')==='true');
await page.waitForTimeout(600);const draws=await page.evaluate(()=>window.__drawCount);await page.waitForTimeout(700);const idleDraws=await page.evaluate(()=>window.__drawCount);
check('no idle rendering',draws===idleDraws,{draws,idleDraws});
await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Maliyet',exact:true}).click();check('live reduced motion retains selection',await page.getByRole('button',{name:'Maliyet',exact:true}).getAttribute('aria-pressed')==='true');
await page.emulateMedia({reducedMotion:'no-preference'});
await page.evaluate(()=>document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
await page.getByText('Görünüm kullanılamıyor').waitFor();await page.getByRole('button',{name:'Gider',exact:true}).click();check('context loss preserves HTML',await page.getByRole('button',{name:'Gider',exact:true}).getAttribute('aria-pressed')==='true');
await page.screenshot({path:`${out}/webgl-fallback.png`,fullPage:true});
await page.getByRole('button',{name:'3D’yi yeniden dene'}).click();await page.waitForTimeout(600);check('context retry restores canvas',await page.locator('canvas').count()===1);
const blocked=await browser.newPage({viewport:{width:680,height:1000}});await blocked.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl'||kind==='webgl2'?null:original.call(this,kind,...args);};});
await blocked.goto('http://127.0.0.1:4173/?variant=C');await blocked.getByText('Görünüm kullanılamıyor').waitFor();await blocked.getByRole('button',{name:'Gider',exact:true}).click();check('renderer unavailable remains usable',await blocked.getByRole('button',{name:'Gider',exact:true}).getAttribute('aria-pressed')==='true');await blocked.close();
await writeFile('workstreams/ozet-prototypes/browser-evidence.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));await browser.close();
