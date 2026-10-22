"""
Multi-zone, multi-light Ambilight Engine.
Captures screen once per tick, crops configured zones, applies calibration per light,
and updates Home Assistant lights concurrently without light-count limits.
"""

import time
import threading
from typing import Dict, List, Optional, Tuple
import mss
from PIL import Image

from capture.regions import BUILTIN_LAYOUTS, ZoneDefinition, extract_zone_colors
from ha.client import HomeAssistantClient
from lights.base import Light, LightCommand


class MultiZoneAmbilightEngine:
    def __init__(
        self,
        ha_client: HomeAssistantClient,
        lights: Dict[str, Light],
        layout_name: str = "split_2_vertical",
        zone_mappings: Optional[Dict[str, str]] = None,
        config: Optional[dict] = None,
    ):
        """
        Args:
            ha_client: Home Assistant client.
            lights: Dict of {light_id: Light_instance}.
            layout_name: One of the keys in BUILTIN_LAYOUTS.
            zone_mappings: Dict of {zone_id: light_id} or {light_id: zone_id}.
            config: System config dictionary.
        """
        self.ha = ha_client
        self.lights = lights
        self.layout_name = layout_name
        self.config = config or {}

        # Mapping: light_id -> zone_id
        self.light_to_zone: Dict[str, str] = {}
        if zone_mappings:
            for k, v in zone_mappings.items():
                if k in self.lights:
                    self.light_to_zone[k] = v
                elif v in self.lights:
                    self.light_to_zone[v] = k

        # Fallback default assignments
        if not self.light_to_zone and self.lights:
            available_zones = [z.id for z in self.get_active_zones()]
            for idx, light_id in enumerate(self.lights.keys()):
                assigned = available_zones[idx % len(available_zones)]
                self.light_to_zone[light_id] = assigned

        # State tracking
        self.is_running = False
        self.last_colors: Dict[str, Tuple[int, int, int]] = {}
        self.lights_on: Dict[str, bool] = {l_id: True for l_id in self.lights}
        self.current_fps: float = 0.0
        self.latest_zone_colors: Dict[str, Tuple[int, int, int]] = {}

        self._sct: Optional[mss.mss] = None
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

    def get_active_zones(self) -> List[ZoneDefinition]:
        return BUILTIN_LAYOUTS.get(self.layout_name, BUILTIN_LAYOUTS["full"])

    def set_layout(self, layout_name: str, zone_mappings: Optional[Dict[str, str]] = None):
        """Dynamically switch spatial layout and light mappings."""
        if layout_name in BUILTIN_LAYOUTS:
            self.layout_name = layout_name
        if zone_mappings is not None:
            self.light_to_zone = {}
            for k, v in zone_mappings.items():
                if k in self.lights:
                    self.light_to_zone[k] = v
                elif v in self.lights:
                    self.light_to_zone[v] = k

    def _grab_screen_frame(self) -> Image.Image:
        """Capture monitor and downsample for efficient zone extraction."""
        if self._sct is None:
            self._sct = mss.mss()

        monitor = self._sct.monitors[1]
        screenshot = self._sct.grab(monitor)
        img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")

        resize_to = tuple(self.config.get("system", {}).get("resize_to", [160, 90]))
        return img.resize(resize_to)

    def tick(self):
        """Execute one complete sampling and update cycle."""
        # 1. Capture screen
        frame = self._grab_screen_frame()

        # 2. Extract colors per active zone
        zones = self.get_active_zones()
        zone_colors = extract_zone_colors(frame, zones)
        self.latest_zone_colors = zone_colors

        # Default fallback color if light's assigned zone isn't in current layout
        fallback_color = next(iter(zone_colors.values()), (0, 0, 0))

        # 3. Process and dispatch to each light
        for light_id, light in self.lights.items():
            assigned_zone = self.light_to_zone.get(light_id)
            r, g, b = zone_colors.get(assigned_zone, fallback_color)

            # Process color through light adapter (applies calibration & CCT)
            cmd = light.process_color(r, g, b)

            # Check off threshold
            off_thresh = light.calibration.get("off_threshold", 0)
            if cmd.brightness < off_thresh:
                if self.lights_on.get(light_id, False):
                    try:
                        self.ha.turn_off(light.entity_id)
                    except Exception:
                        pass
                    self.lights_on[light_id] = False
                continue

            self.lights_on[light_id] = True

            # Threshold to prevent micro-flicker requests
            threshold = light.calibration.get("color_change_threshold", 0)
            current_rgb = cmd.rgb or (cmd.rgbw[:3] if cmd.rgbw else (0, 0, 0))
            last_rgb = self.last_colors.get(light_id)

            if last_rgb and all(abs(a - b) < threshold for a, b in zip(current_rgb, last_rgb)):
                continue

            self.last_colors[light_id] = current_rgb

            # Send payload to Home Assistant
            payload = light.get_ha_payload(cmd)
            try:
                self.ha.turn_on(**payload)
            except Exception as e:
                print(f"[Engine] Error dispatching to {light.entity_id}: {e}")

    def _loop(self):
        interval = self.config.get("system", {}).get("update_interval", 0.08)
        frame_count = 0
        fps_start = time.time()

        while not self._stop_event.is_set():
            t0 = time.time()
            try:
                self.tick()
            except Exception as e:
                print(f"[Engine Loop Error] {e}")

            frame_count += 1
            elapsed = time.time() - t0
            sleep_time = max(0.005, interval - elapsed)
            time.sleep(sleep_time)

            # Update FPS metric every second
            now = time.time()
            if now - fps_start >= 1.0:
                self.current_fps = round(frame_count / (now - fps_start), 1)
                frame_count = 0
                fps_start = now

        # Shutdown: cleanup mss and best-effort turn off lights
        if self._sct:
            self._sct.close()
            self._sct = None

        for light in self.lights.values():
            try:
                self.ha.turn_off(light.entity_id, transition=0)
            except Exception:
                pass

    def start(self):
        if self.is_running:
            return
        self._stop_event.clear()
        self.is_running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def stop(self):
        if not self.is_running:
            return
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2.0)
        self.is_running = False
