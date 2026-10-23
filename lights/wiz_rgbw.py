from lights.base import Light, LightCommand


class WiZRGBWLight(Light):
    """
    WiZ RGBW light driver with calibrated color balance and automatic CCT fallback.
    Prevents pink/violet distortion on whites by switching to cold white (6500K).
    """

    DEFAULT_CALIBRATION = {
        "red_correction": 1.05,
        "green_correction": 0.95,
        "blue_correction": 2.80,
        "gamma": 0.65,
        "brightness_multiplier": 1.0,
        "brightness_min": 70,
        "brightness_max": 255,
        "cct_white_threshold": 25,
        "cct_cold_white": 6500,
        "off_threshold": 18,
        "color_change_threshold": 6,
    }

    def __init__(self, config: dict):
        super().__init__(config)
        # Apply defaults if missing from configuration
        for key, val in self.DEFAULT_CALIBRATION.items():
            if key not in self.calibration:
                self.calibration[key] = val

    @property
    def supported_modes(self) -> list:
        return ["rgb", "rgbw", "cct"]

    def _get_cal(self, key: str, default=None):
        return self.calibration.get(key, self.DEFAULT_CALIBRATION.get(key, default))

    def process_color(self, r: int, g: int, b: int) -> LightCommand:
        # 1. Apply hardware color corrections
        r_corr = min(int(r * self._get_cal("red_correction", 1.0)), 255)
        g_corr = min(int(g * self._get_cal("green_correction", 1.0)), 255)
        b_corr = min(int(b * self._get_cal("blue_correction", 1.0)), 255)

        # 2. Extract white component
        w = min(r_corr, g_corr, b_corr)

        # 3. Calculate brightness with gamma compensation
        brightness_multi = self._get_cal("brightness_multiplier", 1.0)
        gamma = self._get_cal("gamma", 0.65)

        luminance = (0.2126 * r_corr + 0.7152 * g_corr + 0.0722 * b_corr) / 255.0
        corrected_luma = (luminance ** gamma) * 255.0 * brightness_multi

        brillo_min = self._get_cal("brightness_min", 70)
        brillo_max = self._get_cal("brightness_max", 255)
        brillo = max(brillo_min, min(int(corrected_luma), brillo_max))

        # 4. Check for near-white / desaturated color
        # In WiZ bulbs, driving pure RGB white produces a pale violet. We use CCT mode instead.
        white_threshold = self._get_cal("cct_white_threshold", 25)
        max_rgb = max(r_corr, g_corr, b_corr)
        min_rgb = min(r_corr, g_corr, b_corr)

        if (max_rgb - min_rgb) < white_threshold:
            cct_kelvin = self._get_cal("cct_cold_white", 6500)
            return LightCommand(kelvin=cct_kelvin, brightness=brillo, mode="cct")

        # 5. Saturated colors: WiZ handles pure RGB or RGBW with W=0 best
        # Subtracting white prevents washed out pastel colors
        r_w = r_corr - w
        g_w = g_corr - w
        b_w = b_corr - w

        return LightCommand(rgbw=(r_w, g_w, b_w, 0), brightness=brillo, mode="rgbw")
