import { Game } from './game.js';
try { const game=new Game();const params=new URLSearchParams(location.search);if(params.has('debug'))window.voidline=game;if(params.has('smoke'))import('../tests/browser-smoke.js').then(m=>m.installSmokeTest(game)); }
catch(error){console.error(error);document.getElementById('fatal').classList.remove('hidden');document.getElementById('fatal-message').textContent='A WebGL 2 capable browser is required. Enable hardware acceleration and reload. '+error.message;}
