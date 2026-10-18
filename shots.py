# Playwright phone test: 390x844 @3x, no console errors, screenshots of every required screen.
import sys,json,time
from playwright.sync_api import sync_playwright
URL='http://localhost:8765/index.html'
errs=[]
def W(pg,ms=600): pg.wait_for_timeout(ms)
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
    pg=ctx.new_page()
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.evaluate("localStorage.clear()"); pg.reload(); W(pg,2500)
    pg.evaluate("document.querySelector('#sheet .x').click()"); W(pg,300)
    pg.evaluate("Lumen.S.hearts=200;Lumen.devDo('unlock');document.querySelector('#sheet').classList.remove('open')")
    pg.evaluate("Lumen.S.min=7*60+30"); W(pg,300)
    pg.evaluate("Lumen.enterScene('lobby',1)"); W(pg,1500)
    pg.screenshot(path='shots/01-lobby-controls.png')
    pg.evaluate("Lumen.openFloors()"); W(pg,1200)
    pg.screenshot(path='shots/02-floor-picker.png')
    pg.evaluate("Lumen.openTeleport()"); W(pg,1200)
    pg.screenshot(path='shots/03-teleport-picker.png')
    pg.evaluate("document.querySelector('#sheet').classList.remove('open')")
    for n in ['Ares','Zayne','Batzz','Ophion']:
        pg.evaluate(f"Lumen.S.min=(Lumen.S.min); (function(){{const sc=TENANTS['{n}'].sched;let h=0;for(const [t,q] of sc) if(q=='home'){{h=t;}} Lumen.S.min=h*60+30;}})(); Lumen.enterScene('room:{n}',1)"); W(pg,2200)
        pg.screenshot(path=f'shots/04-room-{n.lower()}.png')
        pg.evaluate(f"Lumen.talk('{n}')"); W(pg,2500)
        pg.screenshot(path=f'shots/05-dialogue-{n.lower()}.png')
        pg.evaluate("document.getElementById('dlgSkip').click()"); W(pg,300)
    pg.evaluate("Lumen.openProfile('Ares')"); W(pg,1000)
    pg.screenshot(path='shots/06-profile-card.png')
    pg.evaluate("document.querySelector('#sheet').classList.remove('open');Lumen.openFridge('Ares')"); W(pg,1000)
    pg.screenshot(path='shots/07-fridge-inventory.png')
    pg.evaluate("document.querySelector('#sheet').classList.remove('open')")
    print(json.dumps(errs,indent=1))
    b.close()
