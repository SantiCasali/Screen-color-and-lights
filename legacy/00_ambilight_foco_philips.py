
import mss
import numpy as np
from PIL import Image
import requests
import time

# === CONFIGURACIÓN ===
HASS_URL = "http://192.168.0.101:8123"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjYjAxNzlhMjVmZjU0OTAyYjY1YjM1ODhiOTg0OWE0MSIsImlhdCI6MTc1MjExNTMzNCwiZXhwIjoyMDY3NDc1MzM0fQ.xapZ-aFx1rvd0Q5zctdlVKNwKZWj7rdAbjr8iOnYZ4A"  # recortado por seguridad
ENTITY_ID = "light.wiz_rgbw_tunable_b14126"

# ==========================
# CALIBRACIÓN
# ==========================

BLANCO_FRIO = 6500       # 2200 a 6500
UMBRAL_BLANCO = 25       # menor = menos cambios a modo blanco

RED_CORRECTION = 1.00
GREEN_CORRECTION = 1.00
BLUE_CORRECTION = 1.00

BRILLO_MIN = 120
BRILLO_MAX = 255


INTERVALO_SEGUNDOS = 0.1

def rgb_a_rgbw(r, g, b):
    """
    Convierte color RGB a RGBW extrayendo el componente blanco (w)
    basado en el valor mínimo de los tres canales.
    """
    w = min(r, g, b)
    r = r - w
    g = g - w
    b = b - w
    return int(r), int(g), int(b), int(w)

def obtener_color_promedio():
    with mss.MSS() as sct:  # CORRECCIÓN: mss.MSS() en mayúsculas
        monitor = sct.monitors[1]
        screenshot = sct.grab(monitor)
        img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
        img = img.resize((100, 100))
        np_img = np.array(img)
        avg_color = np_img.mean(axis=(0, 1)).astype(int)
        return tuple(map(int, avg_color))  # (R, G, B)

def calcular_brillo(r, g, b):
    # Fórmula de luminosidad percibida (más precisa para el ojo humano)
    luminosidad = 0.2126 * r + 0.7152 * g + 0.0722 * b
    brillo = max(1, min(int(luminosidad), 255))  # asegurar rango válido
    return brillo

def enviar_color_a_home_assistant(r, g, b, w=0): # CORRECCIÓN: Se agregó 'w' como parámetro
    brillo = calcular_brillo(r, g, b)

    max_rgb = max(r, g, b)
    min_rgb = min(r, g, b)

    diferencia = max_rgb - min_rgb

    url = f"{HASS_URL}/api/services/light/turn_on"

    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }

    # ==========================
    # MODO BLANCO / GRIS
    # ==========================
    if diferencia < UMBRAL_BLANCO:

        data = {
            "entity_id": ENTITY_ID,
            "color_temp_kelvin": BLANCO_FRIO,
            "brightness": brillo
        }

        print(
            f"[WHITE] Kelvin={BLANCO_FRIO} "
            f"Brightness={brillo}"
        )

    # ==========================
    # MODO COLOR
    # ==========================
    else:

        data = {
            "entity_id": ENTITY_ID,
            "rgbw_color": [r, g, b, w], # CORRECCIÓN: Se usa 'w' en lugar del 0 estático
            "brightness": brillo
        }

        print(
            f"[RGBW] ({r},{g},{b},{w}) "
            f"Brightness={brillo}"
        )

    response = requests.post(
        url,
        headers=headers,
        json=data
    )

    if response.status_code != 200:
        print(response.status_code)
        print(response.text)

# === BUCLE PRINCIPAL ===
#while True:
 #   enviar_color_a_home_assistant(255, 255, 255)
  #  time.sleep(2)

while True:
    r, g, b = obtener_color_promedio()
    #print(f"RGB: ({r}, {g}, {b})")
    r, g, b, w = rgb_a_rgbw(r, g, b)
    enviar_color_a_home_assistant(r, g, b, w) # CORRECCIÓN: Ahora se le pasa 'w' a la función
    time.sleep(1)

