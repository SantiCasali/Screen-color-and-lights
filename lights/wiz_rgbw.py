from lights.base import Light, LightCommand


class WiZRGBWLight(Light):
    """WiZ RGBW light with CCT fallback for near-white colors."""

    @property
    def supported_modes(self) -> list:
        return ["rgb", "rgbw", "cct"]

    def _get_cal(self, key: str, default):
        return self.calibration.get(key, default)

    def process_color(self, r: int, g: int, b: int) -> LightCommand:
        # Apply color corrections from calibration
        r_corr = min(int(r * self._get_cal("red_correction", 1.0)), 255)
        g_corr = min(int(g * self._get_cal("green_correction", 1.0)), 255)
        b_corr = min(int(b * self._get_cal("blue_correction", 1.0)), 255)

        # Extract white channel (minimum component)
        w = min(r_corr, g_corr, b_corr)

        # RGBW values (residual color after removing white)
        r_w = r_corr - w
        g_w = g_corr - w
        b_w = b_corr - w

        # Brightness from the real RGB values (color + white)
        brightness_multi = self._get_cal("brightness_multiplier", 1.0)
        brillo = (0.2126 * (r_corr) + 0.7152 * (g_corr) + 0.0722 * (b_corr)) * brightness_multi

        brillo_min = self._get_cal("brightness_min", 1)
        brillo_max = self._get_cal("brightness_max", 255)
        brillo = max(brillo_min, min(int(brillo), brillo_max))

        # CCT detection: near-white → use color temperature mode
        white_threshold = self._get_cal("cct_white_threshold", 20)
        max_rgb = max(r_corr, g_corr, b_corr)
        min_rgb = min(r_corr, g_corr, b_corr)

        if (max_rgb - min_rgb) < white_threshold:
            cct_kelvin = self._get_cal("cct_cold_white", 4000)
            return LightCommand(kelvin=cct_kelvin, brightness=brillo, mode="cct")

        return LightCommand(rgbw=(r_w, g_w, b_w, w), brightness=brillo, mode="rgbw")
