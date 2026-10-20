# Lumen Residences

A portrait phone condo-life game in the Kairosoft style. Play it at **https://superlast2001.github.io/lumen-residences/**

You start in the lobby. **FLOOR** opens the building-front floor picker, and the lobby door opens the teleport picker (Gym, Cafe, Restaurant, Park, Furniture Shop, Night Club). The **D-pad** moves the cursor and **OK** interacts. **TALK** and **FEED** work on the nearest resident. **MENU** holds save/load, residents, the shop, decorate, bag, teleport, cheats and help.

- Residents are Ares, Zayne, Batzz and Ophion. Each has their own room, schedule, personality dialogue and £20 a day rent (collected at 6 AM). The relationship ladder runs Stranger → … → Crush (CONFESSION) → Dating (PROPOSE with a ring) → Married.
- Find New Resident costs hearts and shows a stamp card. The profile card has a portrait, chibi, bio and per-zone ratings from 1 to 5 stars.
- Furniture is bought with rent and can be placed, flipped and stored. The fridge holds an inventory, and the sofa, TV, bed and gym gear are usable with residents.
- All character art is the user's own sheets, sliced directly. Small sprites were upscaled with Real-ESRGAN anime_6B (scripts in `assets/tools/`).

## Known limitations
- Rotate is a mirror flip, because the furniture sheet has one orientation only.
- Zayne's room is the user's flat SVG shell, so it is furnished with sprites from the furniture sheet.
- The lobby and town places have no user art. They are procedural iso interiors using sheet furniture sprites.
- Some furniture slices were unusable (stove, island, stools) and are excluded.
- Ophion's and Batzz's source CG panels crop their wings and tail at the edges.
- Room pathing uses hand-placed waypoints, so it is approximate.
- There is no player avatar, to avoid inventing a character; a cursor is used instead. The ring is a canvas drawing.

## v0.3.2 — new default apartment
- All four tenant flats (Ares, Zayne, Batzz, Ophion) now use one bigger default apartment: 179 floor tiles, up from 120. It has orange walls, glossy cream tiles, a balcony with sliding doors and yellow curtains, a wall AC and a glass front door. A blue-tiled bathroom juts out at the front-right, behind a glass partition with a doorway. The shell is drawn in code (`apt.js`), so walls, the doorway, A* walking and depth sorting all work.
- Starter furniture: a cosy honey bed, a built-in glass shower (fixed, so it can't be moved or stored), a sink and a fridge.
- The shower can be used. Tenants walk through the bathroom doorway and step into the enclosure. You see rain-head water, steam and the glass fogging up, then they come out with a towel. Ophion plays his own painted shower sequence, and his after-shower frames (shake, dry, towel, blush) play as he leaves.
- Old themed rooms are still in `ROOMS_THEMED`. To switch back, set `ROOM_STYLE='themed'` in `data.js`. Themed furniture is still sold in the shop.
- Older saves are migrated once. Placed furniture goes back to storage and each flat gets the new default set.

## v0.3.0 — one art style
- **Furniture** (`furnart.js`): every piece is painted procedurally in the chibi-sprite style (soft cel shading, rounded
  cushiony corners, a dark sticker outline) from a small 3D-ish model, so all **4 facings** are drawn properly (ROTATE
  cycles them). Pieces have front layers (sofa arms, blanket) drawn over a seated/sleeping tenant.
- **NPCs** (`npc.js`, `assets/npc/`): 20 painted chibi sprites in the style of the user's reference sheet (faces added), each with
  front idle / side walk / back / activity views from one generated character sheet, keyed off white with clean alpha.
  Walk bob/lean, runs, reps, punches, dancing and hops are code transforms. Gym 9, club 9, lobby 2 (Theo, Elise).
- **Tenant poses** (sheet sprites only, no edits): sit (sofa/chair/desk, back view on away-facing seats), sleep (lying
  under the blanket), squat with barbell, treadmill run, punch, eat (favourite food), fridge (door opens, then a snack),
  TV, exercise ball, DJ, coach, dance. Idle cycles through the sheet's emote and side poses.
- **Dialogue**: Ares uses his sheet's 8 full-body poses, picked by each line's mood; all tenants use their 8 expressions.
