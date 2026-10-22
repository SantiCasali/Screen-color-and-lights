from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class LightCommand:
    """Light color command after processing."""
    rgb: Optional[tuple] = None
    rgbw: Optional[tuple] = None
    kelvin: Optional[int] = None
    brightness: int = 255
    mode: str = "rgb"


class Light(ABC):
    def __init__(self, config: dict):
        self.config = config
        self.entity_id = config["light"]["entity_id"]
        self.calibration = config.get("calibration", {})
        self.capabilities = config.get("capabilities", {})

    @property
    @abstractmethod
    def supported_modes(self) -> list:
        """Return list of supported modes: 'rgb', 'rgbw', 'cct'"""
        pass

    @abstractmethod
    def process_color(self, r: int, g: int, b: int) -> LightCommand:
        """Convert raw RGB to light-specific format with calibration applied."""
        pass

    def get_ha_payload(self, cmd: LightCommand) -> dict:
        """Convert LightCommand to Home Assistant API payload dict."""
        payload = {"entity_id": self.entity_id}

        if cmd.mode == "cct" and self.capabilities.get("cct"):
            payload["color_temp_kelvin"] = cmd.kelvin
        elif cmd.mode == "rgbw" and self.capabilities.get("rgbw"):
            payload["rgbw_color"] = list(cmd.rgbw)
        else:
            payload["rgb_color"] = list(cmd.rgb)

        payload["brightness"] = cmd.brightness
        return payload
