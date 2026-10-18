# Playwright phone test: 390x844 @3x DPR, no console errors, screenshots of every required screen + gameplay flows.
import json,sys
sys.path.append("/usr/local/lib/python3.13/dist-packages")
from playwright.sync_api import sync_playwright
from PIL import Image
URL='http://localhost:8765/index.html'
errs=[]
def W(pg,ms=600): pg.wait_for_timeout(ms)
def close(pg): pg.evaluate("document.querySelector('#sheet').classList.remove('open')")
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
    pg=ctx.new_page()
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.evaluate("localStorage.clear()"); pg.reload(); W(pg,2500)
    pg.screenshot(path='shots/00-help.png')
    pg.tap('#sheet .x'); W(pg,300)
    pg.evaluate("Lumen.S.min=7*60+30"); W(pg,1500)
    pg.screenshot(path='shots/01-lobby-controls.png')
    # D-pad: hold right then OK on the elevator -> floor picker
    pg.evaluate("Lumen.cur.x=750;Lumen.cur.y=340"); W(pg,400)
    pg.tap('#ok'); W(pg,1000)
    pg.screenshot(path='shots/02-floor-picker.png')
    pg.tap('#findBtn'); W(pg,1200)
    pg.screenshot(path='shots/08-new-resident-stamp.png')
    pg.tap('#stamp'); W(pg,400)
    pg.screenshot(path='shots/02b-floor-picker-after-find.png')
    pg.evaluate("Lumen.devDo('unlock')"); close(pg)
    pg.evaluate("Lumen.enterScene('lobby',1);Lumen.openTeleport()"); W(pg,1200)
    pg.screenshot(path='shots/03-teleport-picker.png'); close(pg)
    home={'Ares':15,'Zayne':5,'Batzz':11,'Ophion':14}
    for n,h in home.items():
        pg.evaluate(f"Lumen.S.min={h}*60+5;Lumen.enterScene('room:{n}',1)"); W(pg,1800)
        pg.evaluate(f"Lumen.focus('{n}')"); W(pg,900)
        pg.screenshot(path=f'shots/04-room-{n.lower()}.png')
        if n=='Ares':
            s=pg.evaluate("Lumen.screenOf('Ares')")
            im=Image.open('shots/04-room-ares.png'); x,y,h3=s['x']*3,s['y']*3,s['h']*3
            im.crop((int(x-h3*.9),int(y-h3*1.25),int(x+h3*.9),int(y+h3*.2))).save('shots/09-chibi-100pct-ares.png')
        pg.evaluate(f"Lumen.talk('{n}')"); W(pg,2600)
        pg.screenshot(path=f'shots/05-dialogue-{n.lower()}.png')
        pg.tap('#dlgSkip'); W(pg,300)
    # chibi crops for all four (100%, device pixels)
    crops=[]
    for n,h in home.items():
        pg.evaluate(f"Lumen.S.min={h}*60+5;Lumen.enterScene('room:{n}',1)"); W(pg,1200); pg.evaluate(f"Lumen.focus('{n}')"); W(pg,500)
        pg.screenshot(path='shots/tmp.png'); s=pg.evaluate(f"Lumen.screenOf('{n}')"); im=Image.open('shots/tmp.png'); x,y,h3=s['x']*3,s['y']*3,s['h']*3
        crops.append(im.crop((int(x-h3*.75),int(y-h3*1.2),int(x+h3*.75),int(y+h3*.15))))
    Wd=sum(c.width for c in crops);Hd=max(c.height for c in crops);c=Image.new('RGB',(Wd,Hd),'white');xx=0
    for cc in crops: c.paste(cc,(xx,0)); xx+=cc.width
    c.save('shots/09-chibi-100pct-all.png')
    # gameplay: use the sofa with Ares, feed, fridge, decorate
    pg.evaluate("Lumen.S.min=15*60+5;Lumen.enterScene('room:Ares',1)"); W(pg,800)
    pg.evaluate("Lumen.actOn(Lumen.targets().find(t=>t.label=='Black sofa'))"); W(pg,6000)
    pg.screenshot(path='shots/10-use-sofa.png'); pg.evaluate("document.getElementById('dlgSkip').click()"); W(pg,300)
    pg.evaluate("Lumen.openProfile('Ares')"); W(pg,900)
    pg.screenshot(path='shots/06-profile-card.png'); close(pg)
    pg.evaluate("Lumen.openFridge('Ares')"); W(pg,900)
    pg.screenshot(path='shots/07-fridge-inventory.png')
    pg.evaluate("fridgeMove('Ares','steak','take')"); W(pg,300)
    pg.evaluate("feed('Ares','steak','bag')"); W(pg,2500); pg.screenshot(path='shots/11-feed.png'); pg.evaluate("document.getElementById('dlgSkip').click()")
    pg.evaluate("Lumen.devDo('money',1000)"); close(pg); pg.evaluate("Lumen.openShop('Gym')"); W(pg,900); pg.screenshot(path='shots/12-shop.png')
    pg.evaluate("buy('treadmill')"); W(pg,400); pg.evaluate("startDecor('treadmill')"); pg.evaluate("Lumen.cur.x=1120;Lumen.cur.y=260"); W(pg,700)
    pg.tap('#bFeed'); W(pg,300); pg.screenshot(path='shots/13-decor-rotate.png'); pg.tap('#bTalk'); W(pg,500)
    print('placed',pg.evaluate("Lumen.S.rooms.Ares.furn.length"),'zone CARDIO',pg.evaluate("zoneLv('Ares','CARDIO')"))
    # confession flow via cheats
    pg.evaluate("Lumen.devDo('tenant','Batzz');Lumen.devDo('rel',4)"); close(pg)
    pg.evaluate("Lumen.S.min=11*60;Lumen.enterScene('room:Batzz',1);Lumen.openProfile('Batzz')"); W(pg,800)
    pg.screenshot(path='shots/14-confession-ready.png')
    pg.evaluate("confess('Batzz')"); W(pg,1500); pg.screenshot(path='shots/15-confession.png')
    for i in range(12): pg.evaluate("dlgNext()"); W(pg,80)
    print('Batzz level',pg.evaluate("REL[relLv('Batzz')]"))
    # gym with tenants present, training
    pg.evaluate("Lumen.S.min=8*60;Lumen.enterScene('place:gym',1)"); W(pg,1500); pg.screenshot(path='shots/16-gym.png')
    pg.evaluate("Lumen.S.min=22*60;Lumen.enterScene('place:club',1)"); W(pg,1500); pg.screenshot(path='shots/17-club.png')
    pg.evaluate("Lumen.S.min=13*60+10;Lumen.enterScene('place:cafe',1)"); W(pg,1500); pg.screenshot(path='shots/18-cafe.png')
    pg.evaluate("Lumen.devDo('day',0)"); W(pg,800); pg.screenshot(path='shots/19-rent.png'); close(pg)
    pg.evaluate("Lumen.devDo('money',0)"); W(pg,500); pg.screenshot(path='shots/20-cheats.png'); close(pg)
    print('ERRORS',json.dumps(errs,indent=1))
    b.close()
