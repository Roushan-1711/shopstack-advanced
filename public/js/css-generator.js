const ids = ['primary','background','card','text','font','fontSize','radius'];
const defaults = {primary:'#315d43',background:'#f7f8f4',card:'#ffffff',text:'#20251f',font:'Arial, sans-serif',fontSize:'16',radius:'10'};
const get = id => document.getElementById(id);
function makeCss(){
  const v = Object.fromEntries(ids.map(id=>[id,get(id).value]));
  return `/* ShopStack generated theme CSS */\n:root {\n  --primary-color: ${v.primary};\n  --page-background: ${v.background};\n  --card-background: ${v.card};\n  --text-color: ${v.text};\n  --base-font-size: ${v.fontSize}px;\n  --corner-radius: ${v.radius}px;\n}\n\nbody { background: var(--page-background); color: var(--text-color); font-family: ${v.font}; font-size: var(--base-font-size); }\nbutton, .button, .btn { background: var(--primary-color); border-color: var(--primary-color); border-radius: var(--corner-radius); }\n.card, .product-card, .panel { background: var(--card-background); color: var(--text-color); border-radius: var(--corner-radius); }\na { color: var(--primary-color); }\n`;
}
function update(){
  const v = Object.fromEntries(ids.map(id=>[id,get(id).value]));
  const preview=get('preview');
  preview.style.setProperty('--p',v.primary); preview.style.setProperty('--bg',v.background);
  preview.style.setProperty('--card',v.card); preview.style.setProperty('--txt',v.text);
  preview.style.setProperty('--fs',`${v.fontSize}px`); preview.style.setProperty('--radius',`${v.radius}px`);
  preview.style.fontFamily=v.font;
  get('fontSizeValue').textContent=`${v.fontSize}px`; get('radiusValue').textContent=`${v.radius}px`;
  get('cssOutput').textContent=makeCss();
}
ids.forEach(id=>get(id).addEventListener('input',update));
get('resetBtn').addEventListener('click',()=>{Object.entries(defaults).forEach(([id,value])=>get(id).value=value);update();});
get('downloadBtn').addEventListener('click',()=>{
  const blob=new Blob([makeCss()],{type:'text/css'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='shopstack-theme.css'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});
update();
