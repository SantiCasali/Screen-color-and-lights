"""Screen capture module for Ambilight color sampling."""

from dataclasses import dataclass

import mss
import numpy as np
from PIL import Image


@dataclass
class RawColor:
    """Raw RGB color sampled from a screen region."""

    r: int
    g: int
    b: int


def capture_screen(resize_to: tuple = (100, 100)) -> RawColor:
    """Capture the primary monitor and return its average color.

    Args:
        resize_to: Target dimensions (width, height) to downsample before averaging.

    Returns:
        RawColor with integer RGB mean values.
    """
    with mss.mss() as sct:
        monitor = sct.monitors[1]
        screenshot = sct.grab(monitor)

        img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
        img = img.resize(resize_to)

        np_img = np.array(img)
        avg = np_img.mean(axis=(0, 1)).astype(int)

        return RawColor(r=int(avg[0]), g=int(avg[1]), b=int(avg[2]))
