// Opt-in browser integration runner. Uses the real game, UI and input listeners.
export function installSmokeTest(game){
 const button=document.createElement('button');button.textContent='RUN BROWSER CHECKS';button.style.cssText='position:fixed;z-index:100;top:78px;right:20px;padding:14px;background:#caff69;color:#142019;border:0';document.body.append(button);
 button.onclick=()=>{
  const results=[];const assert=(condition,label)=>{if(!condition)throw new Error(label);results.push('PASS '+label);};
  const step=(seconds)=>{for(let i=0;i<seconds*120;i++)game.step(1/120);};
  const key=(code,down=true)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true}));
  try{
   document.getElementById('enter-button').click();assert(game.state==='selection','main menu opens hangar');
   for(const kind of ['light','heavy','balanced']){document.querySelector(`[data-kind="${kind}"]`).click();assert(game.player.kind===kind,kind+' selection creates the correct craft');}
   document.getElementById('start-button').click();assert(game.state==='countdown','launch enters countdown');step(3.1);assert(game.state==='race','countdown enters race');
   key('KeyW');step(2);assert(game.player.speed>45,'keyboard W accelerates');key('ShiftLeft');step(.7);assert(game.player.boosting&&game.player.boost<95,'keyboard Shift boosts');key('ShiftLeft',false);
   key('KeyD');key('Space');step(.12);assert(game.player.drifting,'Space + steering initiates drift');key('KeyD',false);key('Space',false);
   key('KeyQ');step(.1);assert(game.player.left===1,'Q activates left air brake');key('KeyQ',false);key('KeyE');step(.1);assert(game.player.right===1,'E activates right air brake');key('KeyE',false);
   key('Escape');assert(game.state==='pause','Escape pauses');const paused=game.time;step(1);assert(game.time===paused,'pause freezes simulation');key('Escape');assert(game.state==='race','Escape resumes');
   game.player.shield=40;const pick=game.track.pickups[0];game.player.s=pick.s;game.player.x=pick.x;game.player.speed=0;step(.02);assert(game.player.shield>40&&pick.cooldown>0,'shield pickup updates real game state');
   game.player.s=game.track.length*.51;game.player.x=17;step(.02);assert(game.player.fall>0,'unguarded edge initiates falling');step(2.6);assert(game.player.respawn===0&&Math.abs(game.player.x)<12,'fall returns to valid checkpoint');
   key('KeyR');step(.02);assert(game.player.respawn>0,'R resets to checkpoint');step(1.2);
   // Restart and drive a complete race through ordinary key listeners and simulation steps.
   game.start();step(3.1);let limit=0;while(game.state==='race'&&limit++<120*150){const p=game.player,correction=-p.x*.17-p.lateral*.13;key('KeyW');key('KeyA',correction<-.12);key('KeyD',correction>.12);game.step(1/120);}
   assert(game.player.completed===3&&game.state==='finish','three laps reach results screen');assert(!document.getElementById('finish').classList.contains('hidden'),'finish screen is visible');assert(document.getElementById('result-best').textContent.includes(':'),'best lap appears in results');
   document.getElementById('again-button').click();assert(game.state==='countdown'&&game.time===0&&game.player.completed===0,'race again resets race state');assert(game.player.shield===game.player.spec.shield,'restart restores shield');
   step(3.1);window.dispatchEvent(new Event('blur'));assert(game.state==='pause','focus loss pauses the race');document.getElementById('quit-button').click();assert(game.state==='selection','pause menu returns to hangar');
   results.push('ALL '+results.length+' BROWSER CHECKS PASSED');console.info(results.join('\n'));
  }catch(error){results.push('FAIL '+error.message);console.error(error);}
  button.remove();const report=document.createElement('pre');report.id='smoke-report';report.textContent=results.join('\n');report.style.cssText='position:fixed;inset:85px 20px auto auto;max-height:75vh;overflow:auto;z-index:100;background:#07121ff5;border:1px solid #caff69;color:#caff69;padding:22px;font:12px/1.65 monospace';document.body.append(report);
 };
}
