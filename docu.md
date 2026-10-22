# AmbilightFoco — Contexto técnico para IA

## Objetivo

Proyecto Python tipo Ambilight: capturar la pantalla de Windows, detectar el color visualmente predominante y reproducirlo mediante un foco inteligente conectado a Home Assistant.

Objetivo final: que el foco acompañe visualmente la pantalla con colores e intensidad similares, evitando errores de representación de blancos y colores.

## Stack

* Windows 11
* Python 3.x
* Visual Studio Code
* `mss` → captura de pantalla
* `Pillow` → procesamiento de imágenes
* `numpy` → procesamiento RGB
* `requests` → API REST de Home Assistant
* Home Assistant OS → máquina virtual
* Foco WiZ RGBW → controlado mediante Home Assistant REST API

## Arquitectura

```text
Monitor Windows
→ mss/Pillow
→ análisis de color
→ decisión RGBW/CCT
→ requests HTTP
→ Home Assistant
→ entidad light.wiz_rgbw_tunable_b14126
→ foco WiZ
```

## Home Assistant

Entidad actual:

```text
light.wiz_rgbw_tunable_b14126
```

Puerto:

```text
8123
```

La IP puede cambiar por DHCP; verificar siempre con `ha network info`.

API:

```text
/api/services/light/turn_on
/api/services/light/turn_off
```

Autenticación mediante Long-Lived Access Token. No guardar el token real en documentación ni repositorios.

## Foco WiZ RGBW

Atributos relevantes:

```yaml
supported_color_modes:
  - color_temp
  - rgbw
min_color_temp_kelvin: 2200
max_color_temp_kelvin: 6500
```

También soporta efectos, pero no son relevantes para Ambilight.

## Pruebas realizadas

### RGB blanco

```yaml
rgbw_color: [255,255,255,0]
```

Resultado: violeta claro.

Conclusión: no utilizar RGB puro para representar blanco.

### Canal W

```yaml
rgbw_color: [0,0,0,255]
```

Resultado: amarillento.

Conclusión: W es cálido; no utilizarlo directamente como blanco neutro.

### RGB + W

```yaml
rgbw_color: [255,0,0,255]
```

Resultado: naranja.

```yaml
rgbw_color: [0,0,255,255]
```

Resultado: violeta claro.

Conclusión: no mezclar W con RGB para colores saturados.

### CCT

`color_temp_kelvin: 6500` produce el blanco más parecido al monitor probado.

Cambiar `brightness` en CCT modifica principalmente la intensidad sin alterar significativamente el tono.

## Estrategia de color actual

### Colores saturados

Usar:

```yaml
rgbw_color: [R,G,B,0]
```

El canal W debe permanecer en `0`.

### Blancos/grises

Detectar baja saturación y usar:

```yaml
color_temp_kelvin: BLANCO_FRIO
brightness: calculado
```

Variable:

```python
BLANCO_FRIO = 6500
```

Rango disponible:

```text
2200–6500 K
```

## Detección de blanco

Calcular:

```python
diferencia = max(r,g,b) - min(r,g,b)
```

Si:

```python
diferencia < UMBRAL_BLANCO
```

tratar como color neutro y utilizar CCT.

Variable configurable:

```python
UMBRAL_BLANCO = 25
```

Menor valor = detección de blanco más estricta.

## Captura de pantalla

Actualmente funciona correctamente con:

```python
with mss.mss() as sct:
    monitor = sct.monitors[1]
    screenshot = sct.grab(monitor)
```

La captura se convierte a RGB y se reduce para acelerar el análisis.

## Color predominante

No utilizar como solución definitiva:

```python
np_img.mean(axis=(0,1))
```

porque mezcla colores opuestos.

Problema:

```text
50% azul + 50% naranja → promedio gris/marrón
```

La solución deseada:

1. Reducir captura.
2. Cuantizar/agrupar colores.
3. Ignorar negro y colores demasiado oscuros.
4. Considerar saturación.
5. Contar frecuencia de grupos.
6. Seleccionar color predominante.

Los bordes negros de películas/videos no deben dominar el resultado.

## Brillo

Luminosidad utilizada:

```python
L = 0.2126*r + 0.7152*g + 0.0722*b
```

Variables:

```python
BRILLO_MIN
BRILLO_MAX
GAMMA
UMBRAL_APAGADO
```

Si la pantalla está demasiado oscura:

```text
brillo < UMBRAL_APAGADO
→ light.turn_off
```

Cuando vuelve a haber suficiente luminosidad:

```text
→ light.turn_on
```

## Corrección RGB

Variables disponibles:

```python
RED_CORRECTION = 1.0
GREEN_CORRECTION = 1.0
BLUE_CORRECTION = 1.0
```

Se utilizan para compensar diferencias entre el monitor y la reproducción del foco.

## Actualización

Variable:

```python
INTERVALO_SEGUNDOS = 0.1
```

Evitar solicitudes si el cambio RGB es insignificante:

```python
COLOR_CHANGE_THRESHOLD
```

## Versión tenue prevista

Variables:

```python
TIEMPO_ACTUALIZACION
TIEMPO_TRANSICION
```

Objetivo:

* Actualizaciones menos frecuentes.
* Transiciones suaves entre colores.
* Evitar cambios bruscos.

## Calibración prevista

Crear herramienta independiente para mostrar colores conocidos en pantalla y registrar cómo debe configurarse el foco.

Datos potenciales:

```text
RGB pantalla
RGB enviado
RGB observado/corregido
brillo
modo RGBW/CCT
Kelvin
```

Objetivo posterior: generar una tabla/modelo de corrección para mejorar la fidelidad del foco.

## Variables principales

```python
HASS_URL
TOKEN
ENTITY_ID

INTERVALO_SEGUNDOS

BRILLO_MIN
BRILLO_MAX
GAMMA
UMBRAL_APAGADO

RED_CORRECTION
GREEN_CORRECTION
BLUE_CORRECTION

UMBRAL_BLANCO
BLANCO_FRIO

COLOR_CHANGE_THRESHOLD

TIEMPO_ACTUALIZACION
TIEMPO_TRANSICION
```

## Decisiones importantes

* No usar promedio RGB como algoritmo final.
* Priorizar color predominante.
* Ignorar negros/bordes oscuros.
* RGBW con `W=0` para colores saturados.
* CCT para blancos/grises.
* `BLANCO_FRIO = 6500` como valor inicial.
* Brillo independiente del color CCT.
* Mantener parámetros de calibración configurables.
* No exponer tokens en documentación/repositorios.

## Próximo desarrollo

1. Implementar detección robusta de color predominante.
2. Integrarla al código WiZ RGBW.
3. Mantener detección RGB vs CCT.
4. Ajustar brillo y apagado automático.
5. Agregar transiciones suaves.
6. Crear herramienta de calibración.
7. Generar datos de calibración.
8. Crear corrección RGB/RGBW basada en las mediciones.

## Estado actual

Captura de pantalla: funcionando.

Python: funcionando.

Comunicación REST: funcional cuando Home Assistant está accesible.

Home Assistant: funcionando en VM.

Foco WiZ RGBW: conectado y probado manualmente.

RGBW: funcional, pero RGB blanco produce violeta.

CCT 6500K: mejor representación del blanco del monitor.

Problema conocido: la IP de Home Assistant puede cambiar.

Próxima prioridad: reemplazar promedio RGB por detección de color predominante y aplicar la lógica RGBW/CCT.
