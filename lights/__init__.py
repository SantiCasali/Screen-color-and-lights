"""Light factory — maps light type strings to their implementation classes."""

from lights.base import Light
from lights.wiz_rgbw import WiZRGBWLight
from lights.foco_pieza import FocoPiezaLight

LIGHT_TYPES = {
    "wiz_rgbw": WiZRGBWLight,
    "foco_pieza": FocoPiezaLight,
}


def create_light(config: dict) -> Light:
    """Create a Light instance from its YAML config.

    The config must contain a 'light.type' key that maps to a registered class.
    """
    light_type = config["light"]["type"]
    cls = LIGHT_TYPES.get(light_type)
    if cls is None:
        raise ValueError(
            f"Unknown light type: '{light_type}'. "
            f"Available types: {list(LIGHT_TYPES.keys())}"
        )
    return cls(config)
