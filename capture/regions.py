"""
Module for spatial screen partitioning and sub-region extraction.
Supports normalized coordinates (0.0 to 1.0) so it adapts to any monitor resolution.
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple
from PIL import Image


@dataclass
class RegionRect:
    """Normalized bounding box (values between 0.0 and 1.0)."""
    x: float
    y: float
    width: float
    height: float


@dataclass
class ZoneDefinition:
    id: str
    name: str
    rect: RegionRect


# Built-in spatial partition layouts
BUILTIN_LAYOUTS: Dict[str, List[ZoneDefinition]] = {
    "full": [
        ZoneDefinition(
            id="full",
            name="Pantalla Completa",
            rect=RegionRect(x=0.0, y=0.0, width=1.0, height=1.0),
        ),
    ],
    "split_2_vertical": [
        ZoneDefinition(
            id="left",
            name="Izquierda",
            rect=RegionRect(x=0.0, y=0.0, width=0.5, height=1.0),
        ),
        ZoneDefinition(
            id="right",
            name="Derecha",
            rect=RegionRect(x=0.5, y=0.0, width=0.5, height=1.0),
        ),
    ],
    "split_3_vertical": [
        ZoneDefinition(
            id="left",
            name="Izquierda",
            rect=RegionRect(x=0.0, y=0.0, width=0.33, height=1.0),
        ),
        ZoneDefinition(
            id="center",
            name="Centro",
            rect=RegionRect(x=0.33, y=0.0, width=0.34, height=1.0),
        ),
        ZoneDefinition(
            id="right",
            name="Derecha",
            rect=RegionRect(x=0.67, y=0.0, width=0.33, height=1.0),
        ),
    ],
    "quadrants_4": [
        ZoneDefinition(
            id="top_left",
            name="Esquina Superior Izquierda",
            rect=RegionRect(x=0.0, y=0.0, width=0.5, height=0.5),
        ),
        ZoneDefinition(
            id="top_right",
            name="Esquina Superior Derecha",
            rect=RegionRect(x=0.5, y=0.0, width=0.5, height=0.5),
        ),
        ZoneDefinition(
            id="bottom_left",
            name="Esquina Inferior Izquierda",
            rect=RegionRect(x=0.0, y=0.5, width=0.5, height=0.5),
        ),
        ZoneDefinition(
            id="bottom_right",
            name="Esquina Inferior Derecha",
            rect=RegionRect(x=0.5, y=0.5, width=0.5, height=0.5),
        ),
    ],
    "monitor_backlight": [
        ZoneDefinition(
            id="left_edge",
            name="Borde Izquierdo",
            rect=RegionRect(x=0.0, y=0.0, width=0.25, height=1.0),
        ),
        ZoneDefinition(
            id="top_edge",
            name="Borde Superior",
            rect=RegionRect(x=0.25, y=0.0, width=0.5, height=0.3),
        ),
        ZoneDefinition(
            id="right_edge",
            name="Borde Derecho",
            rect=RegionRect(x=0.75, y=0.0, width=0.25, height=1.0),
        ),
    ],
}


def crop_region(image: Image.Image, rect: RegionRect) -> Image.Image:
    """Crop an image using normalized coordinates (0.0 to 1.0)."""
    img_w, img_h = image.size
    left = int(max(0.0, min(1.0, rect.x)) * img_w)
    top = int(max(0.0, min(1.0, rect.y)) * img_h)
    right = int(max(0.0, min(1.0, rect.x + rect.width)) * img_w)
    bottom = int(max(0.0, min(1.0, rect.y + rect.height)) * img_h)

    # Prevent 0-pixel box
    right = max(left + 1, right)
    bottom = max(top + 1, bottom)

    return image.crop((left, top, right, bottom))


def extract_zone_colors(image: Image.Image, zones: List[ZoneDefinition]) -> Dict[str, Tuple[int, int, int]]:
    """Crop each zone from the captured frame and calculate its average RGB color."""
    import numpy as np

    results: Dict[str, Tuple[int, int, int]] = {}
    for zone in zones:
        sub_img = crop_region(image, zone.rect)
        arr = np.array(sub_img)
        avg = arr.mean(axis=(0, 1)).astype(int)
        results[zone.id] = (int(avg[0]), int(avg[1]), int(avg[2]))
    return results
