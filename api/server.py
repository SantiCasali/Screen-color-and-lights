"""
FastAPI Server for Ambilight Hub.
Exposes REST endpoints for engine control and calibration, plus WebSockets for live telemetry.
"""

import asyncio
from contextlib import asynccontextmanager
from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yaml

from config.settings import get_project_root, load_global_config, load_light_config, list_available_lights
from ha.client import HomeAssistantClient
from lights import create_light
from engine.ambilight import MultiZoneAmbilightEngine
from capture.regions import BUILTIN_LAYOUTS

# ==================== Models ====================
class EngineControlRequest(BaseModel):
    action: str  # "start", "stop", "toggle"

class LayoutChangeRequest(BaseModel):
    layout_name: str
    zone_mappings: Optional[Dict[str, str]] = None

class LightCalibrationPayload(BaseModel):
    red_correction: Optional[float] = None
    green_correction: Optional[float] = None
    blue_correction: Optional[float] = None
    gamma: Optional[float] = None
    brightness_min: Optional[int] = None
    brightness_max: Optional[int] = None
    off_threshold: Optional[int] = None
    cct_white_threshold: Optional[int] = None
    cct_cold_white: Optional[int] = None

# ==================== State & Lifespan ====================
global_config = load_global_config()
ha_client = HomeAssistantClient(
    url=global_config["ha"]["url"],
    token=global_config["ha"]["token"]
)

loaded_lights = {}
for light_name in list_available_lights():
    try:
        cfg = load_light_config(light_name)
        loaded_lights[light_name] = create_light(cfg)
    except Exception as e:
        print(f"Error loading {light_name}: {e}")

engine = MultiZoneAmbilightEngine(
    ha_client=ha_client,
    lights=loaded_lights,
    layout_name="quadrants_4",
    config=global_config,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[API] Starting Ambilight API service...")
    yield
    print("[API] Shutting down Ambilight Engine...")
    engine.stop()

app = FastAPI(
    title="Ambilight WebApp Backend API",
    description="REST & WebSocket API for spatial screen lighting control",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for Next.js webapp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== REST Endpoints ====================
@app.get("/api/status")
def get_status():
    return {
        "running": engine.is_running,
        "fps": engine.current_fps,
        "active_layout": engine.layout_name,
        "lights_count": len(engine.lights),
        "light_mappings": engine.light_to_zone,
    }

@app.post("/api/engine/control")
def control_engine(req: EngineControlRequest):
    if req.action == "start":
        engine.start()
    elif req.action == "stop":
        engine.stop()
    elif req.action == "toggle":
        if engine.is_running:
            engine.stop()
        else:
            engine.start()
    return {"running": engine.is_running}

@app.get("/api/lights")
def get_lights():
    results = []
    for light_id, light in engine.lights.items():
        results.append({
            "id": light_id,
            "name": light.config.get("light", {}).get("name", light_id),
            "entity_id": light.entity_id,
            "type": light.config.get("light", {}).get("type", "generic"),
            "capabilities": light.capabilities,
            "calibration": light.calibration,
            "assigned_zone": engine.light_to_zone.get(light_id),
            "last_color": engine.last_colors.get(light_id, (0, 0, 0)),
            "is_on": engine.lights_on.get(light_id, False),
        })
    return results

@app.post("/api/lights/{light_id}/power")
def toggle_light_power(light_id: str, payload: dict):
    light = engine.lights.get(light_id)
    if not light:
        return {"error": "Light not found"}, 404

    state = payload.get("state", True)
    if state:
        ha_client.turn_on(light.entity_id)
        engine.lights_on[light_id] = True
    else:
        ha_client.turn_off(light.entity_id)
        engine.lights_on[light_id] = False
    return {"light_id": light_id, "state": state}

@app.post("/api/lights/{light_id}/calibrate")
def update_calibration(light_id: str, cal: LightCalibrationPayload):
    light = engine.lights.get(light_id)
    if not light:
        return {"error": "Light not found"}, 404

    # Update in memory
    for k, v in cal.model_dump(exclude_unset=True).items():
        light.calibration[k] = v

    # Persist to YAML file
    yaml_path = get_project_root() / "config" / "lights" / f"{light_id}.yaml"
    try:
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        data.setdefault("calibration", {}).update(cal.model_dump(exclude_unset=True))
        with open(yaml_path, "w", encoding="utf-8") as f:
            yaml.safe_dump(data, f, sort_keys=False)
    except Exception as e:
        print(f"Error saving YAML for {light_id}: {e}")

    return {"status": "ok", "calibration": light.calibration}

@app.get("/api/layouts")
def get_layouts():
    return {
        "active": engine.layout_name,
        "available": list(BUILTIN_LAYOUTS.keys()),
        "mappings": engine.light_to_zone,
    }

@app.post("/api/layouts/select")
def set_layout(req: LayoutChangeRequest):
    engine.set_layout(req.layout_name, req.zone_mappings)
    return {
        "active_layout": engine.layout_name,
        "mappings": engine.light_to_zone,
    }

# ==================== WebSocket Live Stream ====================
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Emit live zone colors, FPS and state every ~100ms
            data = {
                "running": engine.is_running,
                "fps": engine.current_fps,
                "layout": engine.layout_name,
                "zone_colors": engine.latest_zone_colors,
                "lights": {
                    l_id: {
                        "color": engine.last_colors.get(l_id, (0, 0, 0)),
                        "is_on": engine.lights_on.get(l_id, False),
                    }
                    for l_id in engine.lights
                },
            }
            await websocket.send_json(data)
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket client error: {e}")
