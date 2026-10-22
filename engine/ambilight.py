import time

from capture.screen import capture_screen
from ha.client import HomeAssistantClient
from lights.base import Light, LightCommand


class AmbilightEngine:
    def __init__(self, light: Light, ha_client: HomeAssistantClient, config: dict = None):
        self.light = light
        self.ha = ha_client
        self.config = config or {}
        self.foco_encendido = True
        self.last_color = None

    def tick(self) -> bool:
        """One Ambilight cycle. Returns True if color was sent, False if light stayed off."""
        # 1. Capture screen
        raw = capture_screen(tuple(self.config["system"].get("resize_to", [100, 100])))

        # 2. Process color through light implementation
        cmd = self.light.process_color(raw.r, raw.g, raw.b)

        # 3. Check off threshold
        off_threshold = self.light.calibration.get("off_threshold", 0)
        if cmd.brightness < off_threshold:
            if self.foco_encendido:
                self.ha.turn_off(self.light.entity_id)
                self.foco_encendido = False
            return False

        if not self.foco_encendido:
            self.foco_encendido = True

        # 4. Filter small changes
        threshold = self.light.calibration.get("color_change_threshold", 0)
        current = self._extract_rgb(cmd)
        if self.last_color and all(
            abs(a - b) < threshold for a, b in zip(current, self.last_color)
        ):
            return True

        self.last_color = current

        # 5. Send to HA
        payload = self.light.get_ha_payload(cmd)
        self.ha.turn_on(**payload)
        return True

    def _extract_rgb(self, cmd: LightCommand) -> tuple:
        """Extract the RGB values from a LightCommand for change comparison."""
        if cmd.rgb:
            return cmd.rgb
        elif cmd.rgbw:
            return cmd.rgbw[:3]  # just R, G, B for comparison
        return (0, 0, 0)

    def run(self, shutdown_event=None):
        """Main loop — runs tick() repeatedly.

        Args:
            shutdown_event: Optional threading.Event to signal shutdown.
        """
        system_config = self.config.get("system", {})
        interval = system_config.get("update_interval", 0.1)
        print(f"Starting Ambilight with {self.light.config['light']['name']}...")
        try:
            while shutdown_event is None or not shutdown_event.is_set():
                self.tick()
                time.sleep(interval)
        except KeyboardInterrupt:
            pass
        finally:
            print(f"Stopping Ambilight ({self.light.config['light']['name']})...")
            try:
                self.ha.turn_off(self.light.entity_id)
            except Exception:
                pass  # HA may be unavailable during shutdown
