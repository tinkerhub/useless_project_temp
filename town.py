"""Authored town geometry, shared server collision, and ground navigation.

The grid accelerates routing; neither people nor streets are constrained to it.
Map coordinates stay stable when another authored district is added later.
"""

import heapq
import math
from functools import lru_cache

MAP_VERSION = 1
WIDTH, HEIGHT = 12288, 9216
RADIUS = 11
SPEED = 180.0
CELL = 32


def build_map():
    districts = [
        {"name": "Civic Quarter", "x": 5000, "y": 2000, "w": 2500, "h": 1800, "color": "#a8b3a3"},
        {"name": "Old Town", "x": 4400, "y": 3800, "w": 2900, "h": 2400, "color": "#b6bd98"},
        {"name": "West Gardens", "x": 1700, "y": 3300, "w": 2700, "h": 2600, "color": "#97ae88"},
        {"name": "University Hill", "x": 7600, "y": 1600, "w": 3300, "h": 2700, "color": "#9caf97"},
        {"name": "Brookside", "x": 7600, "y": 4700, "w": 3100, "h": 2300, "color": "#adbb94"},
        {"name": "Common Grounds", "x": 3900, "y": 6500, "w": 3500, "h": 2000, "color": "#89a878"},
        {"name": "Station District", "x": 1400, "y": 6500, "w": 2100, "h": 1500, "color": "#b0b297"},
    ]
    buildings = []
    def building(id, name, kind, x, y, w, h, roof, service="grounds"):
        buildings.append({"id": id, "name": name, "kind": kind, "x": x, "y": y,
                          "w": w, "h": h, "roof": roof, "service": service,
                          "entrance": {"x": x + w / 2, "y": y + h + 48}})

    building("home-1", "Ada & Ben’s home", "home", 4900, 3990, 256, 208, "#b5795d", "routine")
    building("home-2", "Cleo’s home", "home", 6860, 5260, 256, 208, "#798e8b", "routine")
    building("shop", "Corner Grocer", "shop", 6260, 4040, 352, 256, "#718f80", "routine")
    building("cafe", "Juniper Café", "cafe", 5650, 4040, 288, 256, "#b98762")
    building("bakery", "Morning Loaf", "bakery", 6810, 4110, 288, 192, "#bd9163")
    building("hospital", "Willow Hospital", "hospital", 5490, 3160, 512, 352, "#8eaaaa", "care")
    building("police", "Town Police", "police", 6420, 3200, 384, 304, "#7e8da4", "reports")
    building("town-hall", "Town Hall", "civic", 5930, 2540, 448, 288, "#a58774")
    building("pharmacy", "Green Cross Pharmacy", "pharmacy", 4990, 3220, 256, 192, "#809d83")
    building("post-office", "Post Office", "civic", 6950, 3230, 256, 224, "#b08572")
    building("college", "Willow College", "college", 8300, 2330, 640, 352, "#b08468")
    building("college-hall", "Arts & Sciences", "college", 9430, 2380, 448, 288, "#a27a65")
    building("library", "Public Library", "library", 8370, 3210, 416, 256, "#8b9b86")
    building("student-housing", "College Residences", "apartments", 9440, 3260, 448, 288, "#8d919f")
    building("school", "Brookside School", "school", 8670, 5250, 576, 320, "#b89566")
    building("community", "Community House", "civic", 7950, 5260, 352, 256, "#879b91")
    building("restaurant", "The Copper Table", "cafe", 7990, 6150, 320, 224, "#a77158")
    building("apartments-east", "Brookside Apartments", "apartments", 9590, 6160, 416, 256, "#8c939b")
    building("station", "Willow Station", "station", 2220, 7210, 576, 256, "#828d8e")
    building("workshop", "Repair Workshop", "workshop", 1770, 6540, 352, 240, "#998e75")
    building("market", "Garden Market", "shop", 3330, 4040, 384, 256, "#849678")
    building("grove-cafe", "The Grove", "cafe", 5350, 6990, 288, 208, "#aa8466")
    building("sports", "Recreation Pavilion", "civic", 6670, 7260, 352, 224, "#8f9a7c")
    # Authored residential rows. These are fixed addresses, not generated terrain.
    for i, (x, y) in enumerate([(1950,3640),(2440,3640),(3590,3440),(2040,5250),(2580,5350),
                               (3400,5210),(3870,5390),(7950,4140),(8570,4210),(9350,4110),
                               (9870,5070),(9910,5580),(4020,7210),(4440,7620),(5740,5870),
                               (4780,5450),(3330,6240),(10300,3330)]):
        building(f"house-{i+1}", f"{i+1} Willow Lane", "home", x, y, 224, 176,
                 ["#ae7c65", "#80938b", "#a79c77", "#8b8f9d"][i % 4])

    roads = []
    for x in (3000, 4500, 7500, 10400):
        roads.append({"x": x, "y": 1300, "w": 160, "h": 6700})
    for y in (2920, 4600, 6600, 8000):
        roads.append({"x": 1400, "y": y, "w": 9300, "h": 160})
    paths = [{"x": 6050, "y": 2400, "w": 96, "h": 4200},
             {"x": 5100, "y": 5500, "w": 2400, "h": 96},
             {"x": 8200, "y": 3660, "w": 2100, "h": 96},
             {"x": 9050, "y": 1700, "w": 96, "h": 2800},
             {"x": 3800, "y": 7380, "w": 3450, "h": 96}]
    for b in buildings:
        e = b["entrance"]
        paths.append({"x": e["x"] - 32, "y": b["y"] + b["h"], "w": 64, "h": 136})
    plazas = [{"x": 5440, "y": 4870, "w": 1100, "h": 610, "kind": "square"},
              {"x": 5380, "y": 3520, "w": 1580, "h": 220, "kind": "civic"},
              {"x": 8230, "y": 2730, "w": 1830, "h": 160, "kind": "campus"}]
    props = [{"kind": "fountain", "x": 5880, "y": 5130, "r": 64},
             {"kind": "pond", "x": 6040, "y": 7550, "r": 190}]
    for x, y in [(5550,4990),(6260,4990),(5550,5360),(6260,5360),(5580,3620),
                 (6750,3620),(8460,2830),(9800,2830),(5480,7420),(6360,7420)]:
        props.append({"kind": "bench", "x": x, "y": y, "w": 72, "h": 22})
    trees = []
    # Repeat planting patterns along the town's authored avenues and park boundaries.
    for x in range(1700, 10500, 320):
        for y in (4510, 4850, 6500, 8260):
            if not any(b["x"]-70 < x < b["x"]+b["w"]+70 and b["y"]-90 < y < b["y"]+b["h"]+150 for b in buildings):
                trees.append({"x": x, "y": y, "variant": (x//320+y) % 3})
    for x, y in [(1700,1800),(2250,2330),(3680,2110),(4040,1860),(4930,2100),
                 (5350,1630),(6820,1760),(7210,2200),(7950,1930),(10300,1880),
                 (10900,4130),(11100,5260),(11300,6830),(7850,7790),
                 (4160,6880),(4490,7090),(4890,7380),(5230,7910),(5560,8040),
                 (6460,7980),(6730,7710),(7090,6980),(3990,8070),(2250,5960),
                 (2680,5810),(3880,5890),(6710,5910),(7250,5890)]:
        trees.extend({"x": x+dx, "y": y+dy, "variant": j%3} for j,(dx,dy) in enumerate([(0,0),(95,70),(-65,130)]))
    obstacles = [{"shape": "rect", "x": b["x"], "y": b["y"], "w": b["w"], "h": b["h"]} for b in buildings]
    obstacles += [{"shape": "circle", "x": t["x"], "y": t["y"], "r": 15} for t in trees]
    for p in props:
        obstacles.append(dict(p, shape="circle" if "r" in p else "rect"))
    places = {b["id"]: {"kind": b["kind"], "name": b["name"], "anchor": b["entrance"],
                        "region": {"x": b["x"]-90, "y": b["y"]-20, "w": b["w"]+180, "h": b["h"]+180}}
              for b in buildings}
    places["street"] = {"kind": "street", "name": "Willow Avenue", "anchor": {"x": 6098, "y": 4700}}
    places["square"] = {"kind": "square", "name": "Founders’ Square", "anchor": {"x": 6098, "y": 5030},
                        "region": {"x": 5440, "y": 4870, "w": 1100, "h": 610}}
    places["park"] = {"kind": "park", "name": "Common Grounds", "anchor": {"x": 5400, "y": 7440},
                      "region": {"x": 3900, "y": 6900, "w": 3500, "h": 1600}}
    return {"version": MAP_VERSION, "width": WIDTH, "height": HEIGHT, "radius": RADIUS,
            "speed": SPEED, "districts": districts, "buildings": buildings, "roads": roads,
            "paths": paths, "plazas": plazas, "props": props, "trees": trees,
            "obstacles": obstacles, "places": places,
            "spawn": {"x": 6098, "y": 4480}}


TOWN = build_map()
BUCKET = 256
INDEX = {}
for obstacle in TOWN["obstacles"]:
    r = obstacle.get("r", 0)
    x0, y0 = obstacle["x"] - r, obstacle["y"] - r
    x1 = obstacle["x"] + (r or obstacle["w"])
    y1 = obstacle["y"] + (r or obstacle["h"])
    for bx in range(int((x0-RADIUS)//BUCKET), int((x1+RADIUS)//BUCKET)+1):
        for by in range(int((y0-RADIUS)//BUCKET), int((y1+RADIUS)//BUCKET)+1):
            INDEX.setdefault((bx, by), []).append(obstacle)


def walkable(x, y, radius=RADIUS):
    if not (math.isfinite(x) and math.isfinite(y) and radius <= x <= WIDTH-radius and radius <= y <= HEIGHT-radius):
        return False
    for o in INDEX.get((int(x//BUCKET), int(y//BUCKET)), ()):
        if o["shape"] == "circle":
            if math.hypot(x-o["x"], y-o["y"]) < radius+o["r"]:
                return False
        else:
            px = max(o["x"], min(x, o["x"]+o["w"]))
            py = max(o["y"], min(y, o["y"]+o["h"]))
            if math.hypot(x-px, y-py) < radius:
                return False
    return True


def move_point(position, dx, dy):
    """Substeps shorter than the foot radius prevent tunnelling through solids."""
    x, y = position["x"], position["y"]
    steps = max(1, math.ceil(math.hypot(dx, dy)/(RADIUS/2)))
    for _ in range(steps):
        nx, ny = x+dx/steps, y+dy/steps
        if walkable(nx, ny):
            x, y = nx, ny
        elif walkable(nx, y):
            x = nx
        elif walkable(x, ny):
            y = ny
    return {"x": x, "y": y}


def clear_segment(a, b):
    return _clear_segment(a["x"], a["y"], b["x"], b["y"])


@lru_cache(maxsize=65536)
def _clear_segment(ax, ay, bx, by):
    """Continuous clearance test; conservative square corners for route safety."""
    a, b = {"x": ax, "y": ay}, {"x": bx, "y": by}
    if not walkable(a["x"], a["y"]) or not walkable(b["x"], b["y"]):
        return False
    dx, dy = b["x"]-a["x"], b["y"]-a["y"]
    seen = set()
    for bx in range(int(min(a["x"],b["x"])//BUCKET), int(max(a["x"],b["x"])//BUCKET)+1):
        for by in range(int(min(a["y"],b["y"])//BUCKET), int(max(a["y"],b["y"])//BUCKET)+1):
            for o in INDEX.get((bx,by), ()):
                if id(o) in seen:
                    continue
                seen.add(id(o))
                if o["shape"] == "circle":
                    length = dx*dx+dy*dy
                    t = max(0, min(1, ((o["x"]-a["x"])*dx+(o["y"]-a["y"])*dy)/length)) if length else 0
                    if math.hypot(a["x"]+t*dx-o["x"], a["y"]+t*dy-o["y"]) < o["r"]+RADIUS+0.01:
                        return False
                else:
                    lo, hi = 0.0, 1.0
                    for origin, delta, lower, upper in ((a["x"],dx,o["x"]-RADIUS,o["x"]+o["w"]+RADIUS), (a["y"],dy,o["y"]-RADIUS,o["y"]+o["h"]+RADIUS)):
                        if abs(delta)<1e-12:
                            if not lower < origin < upper:
                                hi = -1
                                break
                        else:
                            x, y = (lower-origin)/delta, (upper-origin)/delta
                            lo, hi = max(lo,min(x,y)), min(hi,max(x,y))
                    if lo+1e-9 < hi and hi>1e-9 and lo<1-1e-9:
                        return False
    return True


def place_at(position):
    x, y = position["x"], position["y"]
    for id, place in TOWN["places"].items():
        r = place.get("region")
        if r and r["x"] <= x <= r["x"]+r["w"] and r["y"] <= y <= r["y"]+r["h"]:
            return id
    return "street"


def distance(a, b):
    return math.hypot(a["x"]-b["x"], a["y"]-b["y"])


def destination_anchor(citizen_id, place_id):
    """Separate arrival spots keep the small population individually readable."""
    anchor = dict(TOWN["places"][place_id]["anchor"])
    slot = int(citizen_id.split("-")[-1])-1 if citizen_id.startswith("citizen-") else 1
    anchor["x"] += {0:-55, 1:0, 2:55}.get(slot, ((slot%10)-4)*26)
    if slot>2:
        anchor["y"] += (slot//10)*26
    if not walkable(anchor["x"], anchor["y"]):
        return dict(TOWN["places"][place_id]["anchor"])
    return anchor


@lru_cache(maxsize=120000)
def open_cell(x, y):
    return walkable(x*CELL+CELL/2, y*CELL+CELL/2)


def route(start, end):
    """A* with obstacle clearance and checked segments, including both endpoints."""
    if not walkable(end["x"], end["y"]):
        raise ValueError("Destination is blocked")
    if clear_segment(start, end):
        return [dict(end)]
    def nearby(p):
        cx, cy = int(p["x"]//CELL), int(p["y"]//CELL)
        candidates = [(x,y) for x in range(cx-2,cx+3) for y in range(cy-2,cy+3) if open_cell(x,y)]
        candidates.sort(key=lambda n: distance(p, point(n)))
        return next((n for n in candidates if clear_segment(p, point(n))), None)
    def point(n):
        return {"x": n[0]*CELL+CELL/2, "y": n[1]*CELL+CELL/2}
    source, target = nearby(start), nearby(end)
    if source is None or target is None:
        raise ValueError("No walkable route")
    frontier, costs, previous = [(0, source)], {source: 0}, {}
    closed = set()
    while frontier and len(closed) < 120000:
        _, cell = heapq.heappop(frontier)
        if cell in closed:
            continue
        if cell == target:
            cells = [cell]
            while cell in previous:
                cell = previous[cell]
                cells.append(cell)
            raw = [point(n) for n in reversed(cells)] + [dict(end)]
            result, anchor = [], start
            for i in range(1, len(raw)):
                if not clear_segment(anchor, raw[i]):
                    result.append(raw[i-1])
                    anchor = raw[i-1]
            result.append(dict(end))
            return result
        closed.add(cell)
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
            nxt = (cell[0]+dx, cell[1]+dy)
            if not open_cell(*nxt) or nxt in closed:
                continue
            if dx and dy and (not open_cell(cell[0]+dx, cell[1]) or not open_cell(cell[0],cell[1]+dy)):
                continue
            if not clear_segment(point(cell), point(nxt)):
                continue
            cost = costs[cell] + math.hypot(dx,dy)
            if cost < costs.get(nxt, float("inf")):
                costs[nxt], previous[nxt] = cost, cell
                heapq.heappush(frontier, (cost+math.hypot(nxt[0]-target[0], nxt[1]-target[1]), nxt))
    raise ValueError("No walkable route")
