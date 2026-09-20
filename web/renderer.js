const palette={grass:'#adc496',grassDark:'#a5bd8e',ink:'#314537',path:'#d6c7a6',road:'#a8aaa1',curb:'#ddd7bd'};
const clothes={'citizen-1':'#ce7752','citizen-2':'#6b889c','citizen-3':'#b79548',player:'#477b73'};

export class TownRenderer {
  constructor(canvas,map) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.map=map;
    this.camera={...map.spawn};this.zoom=1;this.width=0;this.height=0;
    this.patterns=new Map();this.resize();
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
  }
  resize() {
    this.width=this.canvas.clientWidth;this.height=this.canvas.clientHeight;
    const dpr=Math.min(devicePixelRatio||1,2);this.dpr=dpr;
    this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);
    this.ctx.fillStyle=palette.grass;this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    if(this.lastDraw)this.draw(...this.lastDraw);
  }
  visible(o,pad=110) {
    const c=this.camera,w=this.width/this.zoom/2,h=this.height/this.zoom/2;
    return o.x+(o.w||0)+pad>c.x-w&&o.x-pad<c.x+w&&o.y+(o.h||0)+pad>c.y-h&&o.y-pad<c.y+h;
  }
  round(x,y,w,h,r,fill,stroke) {
    const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);
    if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}
  }
  ellipse(x,y,rx,ry,fill) {const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
  text(text,x,y,size=15,color=palette.ink,align='center',font='sans-serif') {
    const c=this.ctx;c.fillStyle=color;c.font=`500 ${size}px ${font}`;c.textAlign=align;c.fillText(text,x,y);
  }
  follow(p,dt,snap=false) {
    const k=snap?1:1-Math.exp(-dt*9);
    this.camera.x+=(p.x-this.camera.x)*k;this.camera.y+=(p.y-this.camera.y)*k;
    const hw=this.width/this.zoom/2,hh=this.height/this.zoom/2;
    this.camera.x=Math.max(hw,Math.min(this.map.width-hw,this.camera.x));
    this.camera.y=Math.max(hh,Math.min(this.map.height-hh,this.camera.y));
  }
  terrain() {
    const c=this.ctx,m=this.map;
    c.fillStyle=palette.grass;c.fillRect(0,0,m.width,m.height);
    // Low-contrast ground marks on a fixed authored surface, independent of zoom.
    const x0=Math.max(0,Math.floor((this.camera.x-this.width/this.zoom/2)/110)*110);
    const y0=Math.max(0,Math.floor((this.camera.y-this.height/this.zoom/2)/110)*110);
    c.strokeStyle='#91ac7c';c.globalAlpha=.32;c.lineWidth=1.3;
    c.beginPath();
    for(let x=x0;x<this.camera.x+this.width/this.zoom/2+110;x+=110) for(let y=y0;y<this.camera.y+this.height/this.zoom/2+110;y+=110){
      const jitter=(x*7+y*3)%53;c.moveTo(x+jitter,y+18);c.lineTo(x+jitter-3,y+12);c.moveTo(x+jitter+2,y+18);c.lineTo(x+jitter+5,y+12);
    }c.stroke();c.globalAlpha=1;
    for(const r of m.roads) if(this.visible(r)) {
      this.round(r.x-25,r.y-25,r.w+50,r.h+50,12,palette.curb);
      c.fillStyle=palette.road;c.fillRect(r.x,r.y,r.w,r.h);
    }
    for(const r of m.roads) if(this.visible(r)) {
      c.strokeStyle='#e3debf';c.lineWidth=3;c.setLineDash([22,27]);c.beginPath();
      if(r.w>r.h){c.moveTo(r.x,r.y+r.h/2);c.lineTo(r.x+r.w,r.y+r.h/2);}
      else {c.moveTo(r.x+r.w/2,r.y);c.lineTo(r.x+r.w/2,r.y+r.h);}c.stroke();c.setLineDash([]);
    }
    for(const p of m.paths) if(this.visible(p)) this.round(p.x,p.y,p.w,p.h,7,palette.path);
    for(const p of m.plazas) if(this.visible(p)) {
      this.round(p.x-8,p.y-8,p.w+16,p.h+16,16,'#b5b48f');
      this.round(p.x,p.y,p.w,p.h,12,'#d5caac');
      c.strokeStyle='#c6ba9b';c.lineWidth=1;c.beginPath();
      for(let x=p.x+48;x<p.x+p.w;x+=48){c.moveTo(x,p.y);c.lineTo(x,p.y+p.h);}
      for(let y=p.y+48;y<p.y+p.h;y+=48){c.moveTo(p.x,y);c.lineTo(p.x+p.w,y);}c.stroke();
    }
    // Painted crossings and road names orient the player without extra panels.
    for(const x of [4500,7500])for(const y of [2920,4600,6600]) if(this.visible({x,y,w:160,h:160})){
      c.fillStyle='#e7e1c6';for(let i=0;i<6;i++)c.fillRect(x+14+i*24,y-52,12,35);
    }
    for(const [name,x,y] of [['W I L L O W   A V E N U E',6000,4690],['C I V I C   W A Y',6010,3008],['P A R K   R O A D',5500,6690]])
      if(this.visible({x,y},400))this.text(name,x,y,13,'#666f62');
    // The school field is usable ground; its lines are scenery.
    if(this.visible({x:8580,y:5810,w:840,h:520})){
      this.round(8580,5810,840,520,12,'#8ead7d');c.strokeStyle='#dbe1bc';c.lineWidth=3;c.strokeRect(8610,5840,780,460);
      c.beginPath();c.moveTo(9000,5840);c.lineTo(9000,6300);c.arc(9000,6070,75,0,Math.PI*2);c.stroke();
    }
    c.strokeStyle='#657c58';c.lineWidth=24;c.strokeRect(12,12,m.width-24,m.height-24);
  }
  building(b) {
    const c=this.ctx,{x,y,w,h}=b,fascia=35;
    this.round(x+16,y+18,w+12,h+12,7,'#63745538');
    this.round(x,y,w,h,3,'#e3d7b6','#6b766344');
    c.fillStyle='#c8b995';c.fillRect(x,y+h-fascia,w,fascia);
    // Roof footprint and ridge share a consistent bird’s-eye perspective.
    this.round(x-9,y-8,w+18,h-fascia+8,5,b.roof,'#42544666');
    c.save();c.globalAlpha=.16;c.fillStyle='#ffffff';c.beginPath();c.moveTo(x-8,y-6);c.lineTo(x+w/2,y+22);c.lineTo(x+w/2,y+h-fascia-8);c.lineTo(x-8,y+h-fascia);c.closePath();c.fill();c.restore();
    c.strokeStyle='#344d4230';c.lineWidth=2;c.beginPath();
    for(let line=y+18;line<y+h-fascia-5;line+=17){c.moveTo(x+2,line);c.lineTo(x+w-2,line);}c.stroke();
    c.strokeStyle='#e0d6b45c';c.lineWidth=5;c.beginPath();c.moveTo(x+w/2,y+4);c.lineTo(x+w/2,y+h-fascia-7);c.stroke();
    this.round(x+30,y+30,28,40,2,'#b5b39c','#6b7663');
    this.round(x+34,y+30,20,13,1,'#5d695d');
    for(let wx=x+24;wx<x+w-20;wx+=58){
      if(Math.abs(wx-(x+w/2))<43)continue;
      this.round(wx,y+h-28,25,19,2,'#526f70');c.strokeStyle='#d8dcc0';c.lineWidth=2;c.beginPath();c.moveTo(wx+12,y+h-27);c.lineTo(wx+12,y+h-10);c.stroke();
    }
    this.round(x+w/2-19,y+h-32,38,32,2,'#4b665b');
    c.fillStyle='#d7c99b';c.fillRect(x+w/2+10,y+h-16,3,3);
    this.round(x+w/2-28,y+h+2,56,12,2,'#ece1c1');
    if(['shop','cafe','bakery'].includes(b.kind)) {
      this.round(x+32,y+h-47,w-64,22,2,'#eee2bc');
      c.fillStyle=b.kind==='cafe'?'#b27651':'#527c65';
      for(let k=x+34;k<x+w-34;k+=28)c.fillRect(k,y+h-46,14,20);
    }
    if(b.kind==='hospital'||b.kind==='pharmacy') {
      const sx=x+w*.72,sy=y+(h-fascia)/2;c.fillStyle='#f1ead7';c.fillRect(sx-22,sy-22,44,44);
      c.fillStyle='#a95d4a';c.fillRect(sx-5,sy-15,10,30);c.fillRect(sx-15,sy-5,30,10);
    }
    if(b.kind==='police') {
      const sx=x+w*.72,sy=y+h*.4;c.fillStyle='#d4c490';c.beginPath();c.moveTo(sx-16,sy-20);c.lineTo(sx+16,sy-20);c.lineTo(sx+16,sy+6);c.lineTo(sx,sy+22);c.lineTo(sx-16,sy+6);c.closePath();c.fill();
    }
    // Label plates are in-world signage; the doorway below remains unobscured.
    if(this.zoom>=.7 || b.service!=='grounds') {
      c.font='600 14px sans-serif';const width=Math.min(w-22,c.measureText(b.name).width+26);
      this.round(x+w/2-width/2,y+h-80,width,26,3,'#f1e6ca','#756e5540');
      this.text(b.name,x+w/2,y+h-62,14,'#475344');
    }
    c.strokeStyle='#ede6c8';c.lineWidth=3;c.beginPath();c.moveTo(b.entrance.x-6,b.entrance.y+12);c.lineTo(b.entrance.x,b.entrance.y+6);c.lineTo(b.entrance.x+6,b.entrance.y+12);c.stroke();
  }
  tree(t) {
    const {x,y}=t,c=this.ctx;
    this.ellipse(x+16,y+7,42,24,'#536d3a26');
    this.round(x-5,y-31,10,38,2,'#846d4a');
    const colors=[['#65894f','#739959','#86a86a'],['#63866b','#769a79','#8cac83'],['#879a58','#95a764','#a5b575']][t.variant];
    this.ellipse(x,y-45,42,36,colors[0]);this.ellipse(x-13,y-62,29,29,colors[1]);this.ellipse(x+12,y-56,30,26,colors[1]);this.ellipse(x-7,y-73,23,19,colors[2]);
    c.strokeStyle='#425e3b26';c.beginPath();c.arc(x,y-43,32,.1,1.4);c.stroke();
  }
  prop(p,time) {
    if(p.kind==='bench'){
      this.round(p.x+4,p.y+7,p.w,p.h,3,'#62704c22');this.round(p.x,p.y,p.w,p.h,3,'#a58053','#746b48');
      this.ctx.fillStyle='#766447';this.ctx.fillRect(p.x+8,p.y+p.h-3,5,10);this.ctx.fillRect(p.x+p.w-13,p.y+p.h-3,5,10);
    }else if(p.kind==='fountain'){
      this.ellipse(p.x+6,p.y+9,p.r+4,p.r,'#7a8e6855');this.ellipse(p.x,p.y,p.r,p.r,'#d8d1b1');
      this.ellipse(p.x,p.y,p.r-9,p.r-9,'#7caaa7');this.ellipse(p.x,p.y-2,18,13,'#d8d7bb');
      this.ellipse(p.x,p.y-9,8,7,'#e3e2ca');
      this.ctx.strokeStyle='#d8e4cb88';this.ctx.lineWidth=2;this.ctx.beginPath();this.ctx.ellipse(p.x,p.y,(time/110%29)+20,(time/110%29+20)*.7,0,0,Math.PI*2);this.ctx.stroke();
    }else{
      this.ellipse(p.x,p.y,p.r+16,p.r+16,'#8caa76');this.ellipse(p.x,p.y,p.r,p.r,'#7daba4');
      this.ctx.strokeStyle='#bed2b477';this.ctx.lineWidth=2;this.ctx.beginPath();this.ctx.ellipse(p.x,p.y,p.r-28,p.r-28,0,.2,2.7);this.ctx.stroke();
    }
  }
  actor(a,time,selected) {
    const c=this.ctx,{x,y}=a.position,bob=a.moving?Math.sin(time/105)*1.3:0,step=a.moving?Math.sin(time/105)*4:0;
    if(a.id==='player'||selected){c.strokeStyle=a.id==='player'?'#fff9dc':'#e7c982';c.lineWidth=2;c.beginPath();c.ellipse(x,y+1,17,10,0,0,Math.PI*2);c.stroke();}
    this.ellipse(x,y+1,12,6,'#354e3c33');
    this.round(x-8,y-14,6,15+step,2,'#3b514a');this.round(x+2,y-14,6,15-step,2,'#3b514a');
    this.round(x-11,y-31+bob,22,22,5,clothes[a.id]||['#9173a6','#b76b65','#648e9e','#a58b48','#779961','#b77e9b','#7b7cac'][Number(a.id.split('-').pop())%7]);
    this.round(x-14,y-28+bob+step/2,5,16,3,'#d9b38a');this.round(x+9,y-28+bob-step/2,5,16,3,'#d9b38a');
    this.ellipse(x,y-37+bob,10,11,'#dfbb91');
    c.fillStyle=a.id==='citizen-2'?'#5c6252':'#554b38';c.beginPath();c.ellipse(x,y-42+bob,10,7,0,Math.PI,Math.PI*2);c.fill();
    if(a.facing==='up')this.ellipse(x,y-39+bob,9,8,a.id==='citizen-2'?'#5c6252':'#554b38');
    else{c.fillStyle='#394638';const direction=a.facing==='left'?-3:a.facing==='right'?3:0;c.fillRect(x-4+direction,y-38+bob,2,2);c.fillRect(x+3+direction,y-38+bob,2,2);}
    if(a.activity==='needs_help'){this.round(x+14,y-66,20,25,6,'#f0d7a5');this.text('!',x+24,y-48,18,'#815b38');}
    if(a.activity==='sleeping'){this.text('z',x+20,y-47,14,'#49614d');}
    const label=a.id==='player'?'You':a.name;
    c.font='600 13px sans-serif';const w=c.measureText(label).width+16;
    this.round(x-w/2,y+12,w,22,8,a.id==='player'?'#244e45':'#f0e9cd');this.text(label,x,y+27,13,a.id==='player'?'#fff7df':'#40503f');
  }
  draw(actors,time,selected,goal) {
    this.lastDraw=[actors,time,selected,goal];
    const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle=palette.grass;c.fillRect(0,0,this.width,this.height);
    c.translate(this.width/2,this.height/2);c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);
    this.terrain();
    const objects=[];
    for(const b of this.map.buildings)if(this.visible(b))objects.push({y:b.y+b.h,draw:()=>this.building(b)});
    for(const t of this.map.trees)if(this.visible(t))objects.push({y:t.y,draw:()=>this.tree(t)});
    for(const p of this.map.props)if(this.visible(p))objects.push({y:p.y,draw:()=>this.prop(p,time)});
    for(const a of actors)if(this.visible(a.position))objects.push({y:a.position.y,draw:()=>this.actor(a,time,a.id===selected)});
    objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
    if(goal){const p=this.map.places[goal].anchor;c.strokeStyle='#f9e4aa';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,29,18,0,0,Math.PI*2);c.stroke();}
  }
  overview(canvas,actors,goal,labels=true) {
    const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,m=this.map,scale=Math.min(w/m.width,h/m.height),ox=(w-m.width*scale)/2,oy=(h-m.height*scale)/2;
    c.fillStyle='#e8e3ce';c.fillRect(0,0,w,h);c.save();c.translate(ox,oy);c.scale(scale,scale);
    c.fillStyle='#a8bd93';c.fillRect(0,0,m.width,m.height);
    for(const d of m.districts){c.fillStyle=d.color;c.fillRect(d.x,d.y,d.w,d.h);}
    c.fillStyle='#e3d5b5';for(const r of [...m.roads,...m.paths])c.fillRect(r.x,r.y,r.w,r.h);
    for(const b of m.buildings){c.fillStyle=b.roof;c.fillRect(b.x,b.y,b.w,b.h);}
    for(const p of m.props)if(p.kind==='pond'){c.fillStyle='#6faaa5';c.beginPath();c.ellipse(p.x,p.y,p.r,p.r*.7,0,0,Math.PI*2);c.fill();}
    if(labels){c.fillStyle='#314a3b';c.font=`600 ${13/scale}px sans-serif`;c.textAlign='center';for(const d of m.districts)c.fillText(d.name,d.x+d.w/2,d.y+180);}
    c.strokeStyle='#fff5dccc';c.lineWidth=1.5/scale;c.strokeRect(this.camera.x-this.width/this.zoom/2,this.camera.y-this.height/this.zoom/2,this.width/this.zoom,this.height/this.zoom);
    if(goal){const p=m.places[goal].anchor;c.strokeStyle='#704c29';c.lineWidth=2/scale;c.beginPath();c.arc(p.x,p.y,9/scale,0,Math.PI*2);c.stroke();}
    for(const a of actors){c.fillStyle=a.id==='player'?'#244f44':'#c46e43';c.strokeStyle='#fff4d4';c.lineWidth=1.5/scale;c.beginPath();c.arc(a.position.x,a.position.y,(a.id==='player'?4.5:3)/scale,0,Math.PI*2);c.fill();c.stroke();}
    c.restore();
  }
}
