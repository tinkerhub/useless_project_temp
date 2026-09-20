// Presentation-side prediction uses the same foot geometry as town.py.
// The server alone accepts movement and owns the resulting coordinates.
export function makePhysics(map) {
  const radius = map.radius, size = 256, index = new Map();
  for (const o of map.obstacles) {
    const r = o.r || 0;
    for (let bx = Math.floor((o.x-r-radius)/size); bx <= Math.floor((o.x+(r||o.w)+radius)/size); bx++) {
      for (let by = Math.floor((o.y-r-radius)/size); by <= Math.floor((o.y+(r||o.h)+radius)/size); by++) {
        const key = `${bx},${by}`;
        if (!index.has(key)) index.set(key, []);
        index.get(key).push(o);
      }
    }
  }
  function walkable(x,y) {
    if (!Number.isFinite(x)||!Number.isFinite(y)||x<radius||y<radius||x>map.width-radius||y>map.height-radius) return false;
    for (const o of index.get(`${Math.floor(x/size)},${Math.floor(y/size)}`)||[]) {
      if (o.shape === 'circle') {
        if (Math.hypot(x-o.x,y-o.y)<radius+o.r) return false;
      } else {
        const px=Math.max(o.x,Math.min(x,o.x+o.w)), py=Math.max(o.y,Math.min(y,o.y+o.h));
        if (Math.hypot(x-px,y-py)<radius) return false;
      }
    }
    return true;
  }
  function move(p,dx,dy) {
    let {x,y}=p;
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/(radius/2)));
    for(let i=0;i<steps;i++) {
      const nx=x+dx/steps,ny=y+dy/steps;
      if(walkable(nx,ny)) {x=nx;y=ny;}
      else if(walkable(nx,y)) x=nx;
      else if(walkable(x,ny)) y=ny;
    }
    return {x,y};
  }
  function clear(a,b) {
    const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/(radius/2)));
    for(let i=0;i<=steps;i++) if(!walkable(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps)) return false;
    return true;
  }
  return {walkable,move,clear};
}
