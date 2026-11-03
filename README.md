# VOIDLINE

An original, playable Three.js anti-gravity racer. Pilot one of three procedural craft around the elevated **Helix Expanse**, above the alien world of **Kepler’s Wake**. Race four AI opponents across three laps.

## Run locally

Requires Node.js 20+ and a modern desktop browser with WebGL 2 / hardware acceleration.

```sh
npm start
```

Then visit **http://localhost:5173**. Alternatively run `node server.js` directly. `PORT=...` can override the port (PowerShell: `$env:PORT=5180; node server.js`). The server listens only on the local machine.

**No install or network connection is required.** The only library, Three.js 0.180.0, is vendored in `vendor/` with its MIT license. `npm install` is optional: there are no dependencies to fetch. No CDN, fonts, images, or audio services are contacted. Do not open `index.html` directly with a file URL; ES modules require the local server.

## Controls

| Key | Action |
| --- | --- |
| W / ↑ | Accelerate |
| S / ↓ | Brake; reverse at low speed |
| A / D or ← / → | Steer |
| Q / E | Independent left / right air brake |
| Space + steering | Drift above 126 km/h |
| Shift | Boost |
| R | Recover at the last checkpoint |
| Escape | Pause / resume |

Click **Enter the Grid**, select a craft, then **Launch Race**. Hold W after the three-second countdown. The track provides gentle heading assistance; steering controls your racing line. Use short steering taps at high speed, air brakes in tight corners, and boost on straights. Keyboard controls are intended for desktop; touch controls are not included.

## Mechanics

- **Needle (light):** fast acceleration, sharp handling, 75 shield, strong drift, low stability.
- **Vector (balanced/default):** balanced acceleration and control, 100 shield.
- **Bastion (heavy):** slow acceleration, highest top speed and momentum, 140 shield, stronger collision resistance.
- Boost consumes energy and recharges when released. Green chevron pads give a free burst. Cyan floating crystals restore shields and reappear after ten seconds.
- Rails, track pylons, and other racers cause collision damage. A brief immunity window prevents repeated damage from one impact. Zero shields, falling, or R initiate recovery at the latest of 12 ordered checkpoints, with at least 70% shield and temporary protection.
- Exposed edges and a short jump occur in the middle of the lap. Maintain speed across the jump. Banked corners and elevation changes affect visual alignment and lateral inertia.
- Finish gates require all sectors in order. Reversing across the line and resetting cannot grant extra laps. The finish screen reports position, race time, and best lap, with replay and hangar options.
- Audio is synthesized with Web Audio after a user gesture. Sound can be muted. Losing focus automatically pauses the race, including the countdown.

## Architecture

Plain JavaScript ES modules, HTML/CSS, Three.js, and a tiny Node HTTP server. No build step.

| File | Responsibility |
| --- | --- |
| `src/main.js` / `src/game.js` | Entry, scene, fixed 120 Hz simulation, race state and input |
| `src/track.js` | Closed spline, surface frames, banks, deck, checkpoints, pickups and pads |
| `src/physics.js` | Pure player handling, damage, respawn, ordered laps, AI and ranking |
| `src/craft.js` | Three different procedural silhouettes, panels, hover and exhaust |
| `src/camera.js` | Smoothed chase camera, banking, FOV and shake |
| `src/environment.js` | Procedural sky, planets, terrain, rocks and structures |
| `src/effects.js` | Reusable particle pool |
| `src/audio.js` | Generated engine and event sounds |
| `src/ui.js` / `src/style.css` | Menus, HUD, minimap, results and styling |
| `tests/physics.test.js` | Deterministic gameplay integration tests |

Track-relative arcade physics intentionally favors predictable control over a rigid-body simulator. AI follows the racing line, slows for curvature, and periodically boosts. Combat consists of contact and shield management; there are no weapons. Instancing, pooled particles, one directional light, and capped pixel ratio keep rendering lightweight. All artwork, names, craft geometry, and sounds are original procedural content.

## Verification

```sh
npm test
# or
node --test tests/*.test.js
```

Tests cover acceleration/braking, boost and recharge, drift and both air brakes, collisions and pickups, exposed-edge and jump recovery, ordered lap completion, checkpoint recovery, AI completion and ranking. Optional `?debug=1` exposes the live game as `window.voidline` for browser inspection; ordinary play has no debug global.

For browser integration checks, visit `http://localhost:5173/?smoke=1` and click **Run Browser Checks**. This opt-in harness tests the real input listeners, menus, countdown, gameplay, complete three-lap race, results, replay, and focus-loss pause. The final verified run passed **13 simulation tests and 25 browser checks**, with no browser console warnings or errors. The browser harness accelerates simulation time; visual checks were also performed separately on the rendered menu, hangar, and chase view. Performance depends on GPU and browser size; no hardware-independent FPS guarantee is claimed.

Three.js reference: https://threejs.org/docs/ . Its license is in `vendor/THREE-LICENSE.txt`.
