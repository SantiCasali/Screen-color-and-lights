import mss
import numpy as np
from PIL import Image
import requests
import time

# === CONFIGURACIÓN ===
HASS_URL = "http://192.168.0.113:8123"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjYjAxNzlhMjVmZjU0OTAyYjY1YjM1ODhiOTg0OWE0MSIsImlhdCI6MTc1MjExNTMzNCwiZXhwIjoyMDY3NDc1MzM0fQ.xapZ-aFx1rvd0Q5zctdlVKNwKZWj7rdAbjr8iOnYZ4A"
ENTITY_ID = "light.foco_pieza"
INTERVALO_SEGUNDOS = 0.1  # <- Cambiá este valor para ajustar la velocidad de actualización

# --- Calibración de brillo ---
BRILLO_MIN = 50
BRILLO_MAX = 255
GAMMA = 0.6
UMBRAL_APAGADO = 25  # Si el brillo cae por debajo, se apaga

# --- Calibración de color ---
RED_CORRECTION = 1.1
GREEN_CORRECTION = 0.9
BLUE_CORRECTION = 1.0

# --- Filtro para evitar cambios pequeños ---
COLOR_CHANGE_THRESHOLD = 5

# Estado del foco
foco_encendido = True
last_color = None

# === FUNCIONES ===

def obtener_color_promedio():
    with mss.mss() as sct:
        monitor = sct.monitors[1]
        screenshot = sct.grab(monitor)
        img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
        img = img.resize((100, 100))
        np_img = np.array(img)
        avg_color = np_img.mean(axis=(0, 1)).astype(int)
        return tuple(map(int, avg_color))

def calcular_brillo(r, g, b):
    luminosidad = 0.2126 * r + 0.7152 * g + 0.0722 * b
    normalizado = luminosidad / 255
    corregido = normalizado ** GAMMA
    brillo = int(corregido * 255)
    return max(1, min(brillo, BRILLO_MAX))

def enviar_color(r, g, b, brillo):
    url = f"{HASS_URL}/api/services/light/turn_on"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    data = {
        "entity_id": ENTITY_ID,
        "rgb_color": [r, g, b],
        "brightness": brillo
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code != 200:
        print("Error al enviar color:", response.status_code, response.text)

def apagar_foco():
    url = f"{HASS_URL}/api/services/light/turn_off"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    data = {
        "entity_id": ENTITY_ID
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code != 200:
        print("Error al apagar foco:", response.status_code, response.text)

# === BUCLE PRINCIPAL ===
while True:
    r, g, b = obtener_color_promedio()

    # Corrección de color
    r_corr = int(min(255, r * RED_CORRECTION))
    g_corr = int(min(255, g * GREEN_CORRECTION))
    b_corr = int(min(255, b * BLUE_CORRECTION))

    brillo = calcular_brillo(r_corr, g_corr, b_corr)

    # Apagado automático
    if brillo < UMBRAL_APAGADO:
        if foco_encendido:
            print("Pantalla muy oscura. Apagando foco.")
            apagar_foco()
            foco_encendido = False
        time.sleep(INTERVALO_SEGUNDOS)
        continue
    else:
        if not foco_encendido:
            print("Pantalla clara. Encendiendo foco.")
            foco_encendido = True

    # Evitar cambios pequeños
    if last_color and all(abs(c1 - c2) < COLOR_CHANGE_THRESHOLD for c1, c2 in zip((r_corr, g_corr, b_corr), last_color)):
        time.sleep(INTERVALO_SEGUNDOS)
        continue

    last_color = (r_corr, g_corr, b_corr)

    print(f"RGB: ({r_corr}, {g_corr}, {b_corr}) -> Brillo: {brillo}")
    enviar_color(r_corr, g_corr, b_corr, brillo)

    time.sleep(INTERVALO_SEGUNDOS)
