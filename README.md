# Lumen Residences

A portrait phone condo-life game in the Kairosoft style. Play it at **https://superlast2001.github.io/lumen-residences/**

You start in the lobby. **FLOOR** opens the building-front floor picker, and the lobby door opens the teleport picker (Gym, Cafe, Restaurant, Park, Furniture Shop, Night Club, Roof Terrace). The **D-pad** moves the cursor and **OK** interacts. **TALK** and **FEED** work on the nearest resident. **MENU** holds save/load, residents, the shop, decorate, bag, teleport, cheats and help.

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
- There is no player avatar, to avoid inventing a character; a cursor is used instead. The ring is a canvas drawing.

## v0.3.4 — big, mostly empty flat at the v0.3.2 scale
- The default camera is back to v0.3.2's close-up scale (zoom 0.6: big tiles, big chibis). You pan around the flat with the D-pad or by dragging. The **−** button or a pinch zooms out to the whole flat, and **+** zooms back in (up to 1.5×).
- The flat grew to **474 floor tiles** (26×20 grid; v0.3.2 had 179, v0.3.3 had 240). It has seven walled rooms joined by 12 doorways: Balcony 40 tiles · Living room 90 · Entrance hall & corridor 93 · Kitchen & dining 81 · Study 56 · Bedroom 72 · Bathroom 42 (with the walk-in glass shower).
- Starter flats are nearly empty again: bed, walk-in shower, sink and fridge. Everything else (all the v0.3.3 starter and study pieces, plus the Luxury tier) is bought in the shop and placed with MENU → Decorate.
- v0.3.3 saves migrate: auto-placed starter furniture is dropped, and anything the player bought (placed or stored) goes to storage.

## v0.3.3 — a real multi-room flat, much more furniture, NPCs everywhere
- **Bigger default apartment** (18×15 grid, 240 floor tiles, up from 179) with seven walled rooms: balcony (decking, sea view, glass railing, yellow-curtained glass sliding doors), living room, entrance hall and corridor, kitchen and dining, study, bedroom, and a bathroom with the walk-in glass shower. Interior walls are cut-away orange walls with white caps (Sims style) so every room stays readable. Tenants only cross between rooms through the 12 doorways (A* plus a door-edge check in the tests). Each room has its own floor: cream tiles, kitchen checks, honey and walnut planks, blue bathroom tiles and decking.
- **Camera:** the default zoom fits the whole flat, front door included, on a 390×844 phone. Zoom in and out with the **+ / −** buttons, pinch or the mouse wheel (up to 3.2×).
- **No star ratings or zone labels on the floor.** Zone ratings are still kept and shown only in MENU → Residents (profile card).
- **Furniture:** 50+ new pieces drawn in `furnart2.js` in the same painted chibi sticker style. Every starter flat comes fully furnished (bed, nightstands, wardrobe, dresser, sofa, armchair, TV, rugs, lamps, plants, kitchen counters, stove, fridge, dining table and chairs, bath, toilet, vanity, washer, and so on), plus a study that suits each tenant.
- **Shop:** sorted by price and badged Basic, Standard, Premium or Luxury. A new **✦ Luxury** tab holds the Dragon Suite collection, inspired by Ophion's old room: dragon bed, chandelier, chesterfield, velvet wingback, grand bookcase, piano, bar, tub and more, priced £420–£3,000.
- **New uses and poses:** cook (stove, island, BBQ), dress (wardrobe, mirror), eat at dining chairs (with food), play the piano (music notes), sunbathe, watch the aquarium, play the arcade. Sofas and armchairs are sittable, and tubs and beds are lie-down.
- **NPCs everywhere:** the 20 painted NPCs follow daily routes (`NPC_SCHED` in `npc.js`) across the lobby, cafe, restaurant, park, furniture shop, gym, club and the new **Roof Terrace** common area. No NPC is ever in two places at once. Joggers loop the park, and each NPC has a place-specific line when you tap them.
- Saves migrate once to the new layout. Bought furniture goes back to storage; only the old built-in defaults are dropped.
- `tools_furn_preview.html#k1,k2` is a dev page that renders FA furniture pieces in all four rotations.

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
