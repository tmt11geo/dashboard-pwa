// Move the existing canvas/controls, preserving relief, rotation, zoom and session.
export function setupReliefFullscreen(redraw){
 const button=document.getElementById('relief-fullscreen');if(!button)return;
 const canvas=document.getElementById('relief'),tools=document.getElementById('relief-tools');
 const dialog=document.createElement('dialog');dialog.className='relief-fullscreen';dialog.setAttribute('aria-label','Full-screen 3D relief');
 const root=document.createElement('div');root.className='relief-fullscreen-content';dialog.append(root);
 const bar=document.createElement('div');bar.className='fullscreen-bar';
 const title=document.createElement('strong');title.textContent='3D relief';
 const back=document.createElement('button');back.type='button';back.textContent='← Return to page';
 const viewport=document.createElement('div');viewport.className='fullscreen-viewport';
 bar.append(title,back);root.append(bar,viewport);document.body.append(dialog);
 let canvasMark,toolsMark,savedScroll,overflow,opened=false,native=false;
 function restore(){
  if(!opened)return;opened=false;native=false;
  canvasMark.replaceWith(canvas);toolsMark.replaceWith(tools);
  dialog.close();document.body.style.overflow=overflow;
  window.scrollTo(savedScroll.x,savedScroll.y);button.focus({preventScroll:true});redraw();
 }
 async function close(){
  if(document.fullscreenElement===root){try{await document.exitFullscreen();}catch{}}
  restore();
 }
 button.addEventListener('click',async()=>{
  if(opened)return;opened=true;savedScroll={x:scrollX,y:scrollY};overflow=document.body.style.overflow;
  canvasMark=document.createComment('relief canvas');toolsMark=document.createComment('relief tools');
  canvas.before(canvasMark);tools.before(toolsMark);viewport.append(canvas);root.append(tools);
  document.body.style.overflow='hidden';dialog.showModal();back.focus();redraw();
  if(root.requestFullscreen){try{await root.requestFullscreen();if(!opened){if(document.fullscreenElement===root)await document.exitFullscreen();return;}native=document.fullscreenElement===root;}catch{/* Full-viewport modal remains usable when native fullscreen is unavailable. */}}
  redraw();
 });
 back.addEventListener('click',close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 document.addEventListener('fullscreenchange',()=>{if(opened&&native&&document.fullscreenElement!==root)restore();redraw();});
 window.addEventListener('pagehide',()=>{if(opened)close();});
}
