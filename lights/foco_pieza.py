from lights.base import Light, LightCommand


class FocoPiezaLight(Light):
    """Simple RGB light for Foco Pieza."""

    @property
    def supported_modes(self) -> list:
        return ["rgb"]

    def process_color(self, r: int, g: int, b: int) -> LightCommand:
        gamma = self.calibration.get("gamma", 0.6)
        brightness_max = self.calibration.get("brightness_max", 255)
        red_correction = self.calibration.get("red_correction", 1.0)
        green_correction = self.calibration.get("green_correction", 1.0)
        blue_correction = self.calibration.get("blue_correction", 1.0)

        # Color correction
        r_corr = int(min(255, r * red_correction))
        g_corr = int(min(255, g * green_correction))
        b_corr = int(min(255, b * blue_correction))

        # Brightness with gamma correction
        luminosidad = 0.2126 * r_corr + 0.7152 * g_corr + 0.0722 * b_corr
        normalizado = luminosidad / 255
        corregido = normalizado ** gamma
        brillo = int(corregido * 255)
        brillo = max(1, min(brillo, brightness_max))

        return LightCommand(
            mode="rgb",
            rgb=(r_corr, g_corr, b_corr),
            brightness=brillo,
        )
