# Fantasy Town v0.0.1.7
Family-friendly isometric condo-manager life sim set in the small town of Lumen Town. Plain HTML5 canvas, no build step: open index.html.

## Town
Fantasy Condo, City Park (pond, benches), Town Plaza (fountain, Mayor Lumen), Cafe, Restaurant, Furniture Shop, Studio. MAP shows the town, tenant locations; tap a place to go, tap a tenant bubble to follow.

## Loop
- Gold comes from rent, collected each morning (sleep in the office bed). Rent = applicant's offer × happiness × friendship bonus.
- ADVERTISE: Front desk → Post ad (20g). Next morning 3 applicants appear, each with portrait, personality, liked themes, favourite furniture, job and rent offer. Choose one; the others leave.
- Condo tower: ground floor office + front desk, tenant floors above; Renovate (150g × floor) to add a floor overnight (max 6).
- Furniture Shop: buy furniture into storage; DECOR inside a room to place/move. Tenants' happiness rises with liked themes (Cozy/Nature/Tech/Books/Aqua/Fun) and their favourite item.
- Schedules: home in the morning, work (Studio/Cafe/Restaurant/Furniture Shop) or hangouts (park/plaza/cafe) by day, lunch at cafe/restaurant, evening hangout, home at 8 PM. They walk the streets between places.
- Tap a tenant → card with FOLLOW (camera tracks them), TALK, HANG OUT. Talking (+1/day) and hanging out (+3/day) raise friendship; each level unlocks one of 3 friendship scenes per tenant.

## Apartments (v0.0.1.0)
- Each tenant unit is an 18×12 apartment split by interior walls/doorways into Kitchen, Bedroom, Bathroom and Living Room (bright Habbo-style walls, white tile / wood floors).
- A unit can only be rented with a Toilet, Bed, Stove and Fridge. Furniture must go in the right room (toilet in bathroom, stove in kitchen...). Wall decor goes on tiles touching the back walls.
- 60+ furniture items in 5 themes (Modern, Cozy Wood, Neon Gamer, Beach, Luxury) plus gym/safety props; tenants like 2 themes and one favourite item. Completing each room's kit (e.g. kitchen: stove, fridge, sink, counter, dining) adds happiness.
- The manager office is a full lobby (front desk, waiting chairs, filing cabinet, notice board, water cooler, extinguisher) + manager bedroom + washroom.

## Controls
Tap/click to walk; WASD/arrows, E use, T talk, F follow, M map, B decor, Esc back. Optional d-pad in settings. Landscape phone first (rotate overlay, fullscreen + landscape lock).
Save: localStorage `fantasytown_save_v8` (older saves reset with +150g).

## Test
`/workspace/tools/pwvenv/bin/python test.py` (headless Playwright, writes screenshot-*.png).

## v0.0.1.7
- New tenant **Ares** (night-club door supervisor, £13.50/h, 9pm–3am), guaranteed first applicant; daily gym visits, loves gym furniture (fav: dumbbell rack); dialogue per friendship level, home/furniture/rent reactions.
- Night Club (neon sign, red carpet, velvet rope) and Lumen Gym added to town.
- Currency is now £ (rent ≈ £700–£950/mo). Debug sheet: ares-sheet.html.

## v0.0.1.7
- Ares art now uses the user's own reference sheet, sliced by `assets/ares/slice.py` (crop + background key only) into 39 PNGs: CG, turnaround, expressions, poses, chibi directions, walk frames, emotes. The contact sheet is `screenshot-ares-slices.png`.
- Dialogue portrait: CG or the pose matching the emotion, plus an expression close-up inset. The in-world sprite uses the chibi directions, walk frames and emote sprites.
- The Night Club sign was raised onto the roof and his club spots moved beside the door. The old drawn Ares art, the duplicate emote function and ares-sheet.html were removed.

## v0.0.1.8
- Ares dialogue: the CG is shown at native resolution (never upscaled, sized for devicePixelRatio), keeps its painted background, and sits in a red frame with an 8px side feather and a bottom fade behind the text box. The expression close-up is a badge anchored to the text box.
- In-world: emote icons are cut from the sheet and drawn at native size beside his head, following him. Edge alpha is decontaminated against the panel colour, and there is a soft radial ground shadow.
- Dialogue art: the CG figure is cut from its garden (alpha only, via `assets/ares/cut_cg.py` + `post_cg.py`) and stands over the live, dimmed location (room or town). It is shown 1:1, never upscaled, anchored to the bottom-left so his left-arm crop sits on the screen edge and his hair top runs off-screen. It has a soft warm rim glow, and his legs fade out behind the text box.

## v0.0.1.9
- Ares dialogue art is now whole, head to toe (`assets/ares/cg_full.png`). The parts the sheet panel cut off were completed offline with SD1.5-inpainting on CPU: lower legs and feet, guided by the sheet's own front turnaround legs (`extend_cg.py`), then his right upper arm and raised elbow/forearm (`extend_arms.py`). `finish_cg.py` puts the untouched CG pixels back on top, colour-matches the new parts to the CG and crossfades only at the seams (24px at the shins, 16px at the arm cuts).
- He stands full-body on the left at up to 90% of the screen height (only ever downscaled), over the live dimmed room or town, with the text box beside him.

## v0.0.2.0 — portrait
- The game now plays upright (portrait); the rotate-to-landscape prompt is gone. Landscape still works.
- Portrait layout: the room camera fits the whole unit, the town camera is width-based, and the stats pill sits under NOTE/MAP. The condo building fills the screen width. Applicants are shown one card at a time with ‹ › arrows.
- Portrait dialogue: whole Ares (`cg_full_hd.png`, Real-ESRGAN anime x4 then Lanczos down to 1200px wide, so phones never upscale it) is centred, filling the screen width, over the current location (lightly dimmed). The text box sits at the bottom over his legs, with a face badge (ESRGAN x4 expression card) at its top-right. The back arrow is hidden during dialogue.
- `assets/ares/head_check.py` verifies that the head equals the sheet pixels (diff 0.000) and that the ESRGAN head keeps its shape (diff 5.10, edge agreement 0.970: ACCEPT).
