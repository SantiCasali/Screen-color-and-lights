import mss
import numpy as np
from PIL import Image
import requests
import time

# === CONFIGURACIÓN ===
HASS_URL = "http://192.168.0.111:8123"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjYjAxNzlhMjVmZjU0OTAyYjY1YjM1ODhiOTg0OWE0MSIsImlhdCI6MTc1MjExNTMzNCwiZXhwIjoyMDY3NDc1MzM0fQ.xapZ-aFx1rvd0Q5zctdlVKNwKZWj7rdAbjr8iOnYZ4A"  # recortado por seguridad
ENTITY_ID = "light.wiz_rgbw_tunable_b14126"

# ==========================
# CALIBRACIÓN
# ==========================

BLANCO_FRIO = 6500       # 2200 a 6500
UMBRAL_BLANCO = 21     # menor = menos cambios a modo blanco
UMBRAL_APAGADO = 15      # Si la suma de R+G+B+W es menor a esto, se apaga el foco

RED_CORRECTION = 1.00
GREEN_CORRECTION = 1.00
BLUE_CORRECTION = 3.00

BRILLO_MIN = 40          # Piso mínimo de luz para que no se vea tan tenue
BRILLO_MAX = 255
MULTIPLICADOR_BRILLO = 1.00  # Potenciador de luz (1.5 = 50% más brillante)

INTERVALO_SEGUNDOS = 0.07

def rgb_a_rgbw(r, g, b):
    """
    Convierte color RGB a RGBW extrayendo el componente blanco (w)
    basado en el valor minimo de los tres canales.
    """
    w = min(r, g, b)
    r = r - w
    g = g - w
    b = b - w
    return int(r), int(g), int(b), int(w)

def obtener_color_promedio():
    with mss.MSS() as sct:  
        monitor = sct.monitors[1]
        screenshot = sct.grab(monitor)
        img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
        img = img.resize((100, 100))
        np_img = np.array(img)
        avg_color = np_img.mean(axis=(0, 1)).astype(int)
        return tuple(map(int, avg_color))  # (R, G, B)

def calcular_brillo(r, g, b, w=0):
    # Volvemos a sumar el blanco para calcular la luminosidad REAL de la pantalla
    r_real = r + w
    g_real = g + w
    b_real = b + w
    
    # Calculamos la luminosidad y la potenciamos con el multiplicador
    luminosidad = (0.2126 * r_real + 0.7152 * g_real + 0.0722 * b_real) * MULTIPLICADOR_BRILLO
    
    # Aseguramos que no baje de BRILLO_MIN ni supere BRILLO_MAX
    brillo = max(BRILLO_MIN, min(int(luminosidad), BRILLO_MAX))  
    return brillo

def enviar_color_a_home_assistant(r, g, b, w=0):
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }

    # ==========================
    # VERIFICACIÓN DE APAGADO
    # ==========================
    # Si la pantalla está muy oscura, apagamos el foco y salimos de la función
    if (r + g + b + w) < UMBRAL_APAGADO:
        url_off = f"{HASS_URL}/api/services/light/turn_off"
        data_off = {"entity_id": ENTITY_ID}
        requests.post(url_off, headers=headers, json=data_off)
        print("[OFF] Pantalla muy oscura. Foco apagado.")
        return 

    # Si pasa la verificación, calculamos el brillo y seguimos normalmente
    brillo = calcular_brillo(r, g, b, w)

    max_rgb = max(r, g, b)
    min_rgb = min(r, g, b)
    diferencia = max_rgb - min_rgb

    url_on = f"{HASS_URL}/api/services/light/turn_on"

    # ==========================
    # MODO BLANCO / GRIS
    # ==========================
    if diferencia < UMBRAL_BLANCO:
        data = {
            "entity_id": ENTITY_ID,
            "color_temp_kelvin": BLANCO_FRIO,
            "brightness": brillo
        }
        print(f"[WHITE] Kelvin={BLANCO_FRIO} Brightness={brillo}")

    # ==========================
    # MODO COLOR
    # ==========================
    else:
        data = {
            "entity_id": ENTITY_ID,
            "rgbw_color": [r, g, b, w],
            "brightness": brillo
        }
        print(f"[RGBW] ({r},{g},{b},{w}) Brightness={brillo}")

    response = requests.post(url_on, headers=headers, json=data)

    if response.status_code != 200:
        print(response.status_code)
        print(response.text)

# === BUCLE PRINCIPAL ===
while True:
    r, g, b = obtener_color_promedio()
    r, g, b, w = rgb_a_rgbw(r, g, b)
    enviar_color_a_home_assistant(r, g, b, w) 
    time.sleep(INTERVALO_SEGUNDOS) # Usando la variable de configuración