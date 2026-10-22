# Backlog de Implementación (Simulación de Issues de GitHub)

Este documento simula los issues de GitHub organizados por hitos (Milestones) y etiquetas (labels), listos para ejecutarse de forma iterativa y trazable.

---

## 🎯 Milestone 1: Hardening, Seguridad y Verificación Base

### Issue #1: Proteger secretos y credenciales de Home Assistant en configuración
- **Labels**: `security`, `configuration`, `priority:critical`
- **Estado**: Por implementar
- **Descripción**:
  Actualmente `config/global.yaml` almacena en texto plano un Long-Lived Token y la URL interna de Home Assistant. Esto es un riesgo crítico si se inicializa y sincroniza un repositorio remoto en Git.
- **Criterios de Aceptación**:
  - [ ] Crear `config/global.example.yaml` con valores ficticios (`http://<IP_HA>:8123`, `TOKEN_AQUI`).
  - [ ] Añadir `config/global.yaml` y `.env` a `.gitignore`.
  - [ ] Documentar en `README.md` el proceso de copia `cp config/global.example.yaml config/global.yaml`.
  - [ ] Confirmar que ningún token real queda registrado en el historial de Git.

---

### Issue #2: Verificación funcional y validación de endpoints contra Home Assistant
- **Labels**: `testing`, `integration`, `priority:high`
- **Estado**: Por implementar
- **Descripción**:
  Asegurar que el sistema actual ejecuta el loop correctamente con la VM actual de Home Assistant tanto para un foco individual (`wiz_rgbw`, `foco_pieza`) como para dos focos concurrentes.
- **Criterios de Aceptación**:
  - [ ] Verificar salida de `python main.py --list`.
  - [ ] Validar respuesta 200 en `ha.client.turn_on` y `ha.client.turn_off`.
  - [ ] Registrar comportamiento del apagado automático bajo pantalla negra.
  - [ ] Validar desconexión limpia (handling de `Ctrl+C` y apagado seguro de luces).

---

## 🎯 Milestone 2: Particionador de Pantalla y Asignación de Zonas

### Issue #3: Implementar módulo de regiones relativas de captura (`capture/regions.py`)
- **Labels**: `feature`, `engine`, `priority:high`
- **Estado**: Por implementar
- **Descripción**:
  Actualmente `capture_screen` solo obtiene el promedio de toda la pantalla. Se requiere una abstracción matemática que permita definir zonas mediante coordenadas normalizadas (0.0 a 1.0) y extraer sub-imágenes.
- **Modos de zona a soportar**:
  1. `full`: Coordenadas `(0, 0, 1.0, 1.0)`.
  2. `split_2_vertical`: Izquierda `(0, 0, 0.5, 1.0)` y Derecha `(0.5, 0, 0.5, 1.0)`.
  3. `split_3_vertical`: Izquierda, Centro y Derecha.
  4. `quadrants_4`: Top-Left, Top-Right, Bottom-Left, Bottom-Right.
  5. `ambient_back`: Zonas de perímetro (superior, laterales, centro).
- **Criterios de Aceptación**:
  - [ ] Función `crop_region(image, region_rect) -> Image`.
  - [ ] Soporte para recortar múltiples zonas en una sola captura para no saturar CPU con llamadas repetidas a `mss`.
  - [ ] Tests unitarios con imágenes sintéticas para validar cortes exactos.

---

### Issue #4: Mapeo declarativo Zona -> Foco y remoción del límite de 2 focos
- **Labels**: `architecture`, `engine`, `priority:high`
- **Estado**: Por implementar
- **Descripción**:
  `main.py` y `engine/ambilight.py` deben evolucionar para admitir $N$ focos y mapear cada foco a su respectiva zona de captura.
- **Criterios de Aceptación**:
  - [ ] Configuración en YAML para relacionar `light_id` con `zone_id`.
  - [ ] Soporte para que dos o más focos puedan escuchar la misma zona (ej. dos focos traseros al centro o a los lados).
  - [ ] El despachador debe procesar las zonas y actualizar concurrentemente los focos correspondientes.

---

## 🎯 Milestone 3: Extracción de Color Predominante y Filtrado Avanzado

### Issue #5: Algoritmo de color predominante con descarte de bordes negros
- **Labels**: `algorithm`, `image-processing`, `priority:high`
- **Estado**: Por implementar
- **Descripción**:
  El promedio directo `np_img.mean(axis=(0,1))` neutraliza colores contrastantes (50% azul + 50% naranja = marrón/gris) y se distorsiona con barras negras de películas (aspect ratio 21:9 o 16:9).
- **Criterios de Aceptación**:
  - [ ] Algoritmo de cuantización (k-means o histogramas reducidos en espacio HSV/RGB).
  - [ ] Filtrado de píxeles con brillo inferior a `dark_threshold` para evitar sesgo de barras negras.
  - [ ] Ponderación por nivel de saturación para priorizar tonos vivos sobre fondos neutros.
  - [ ] Salida compatible con el objeto `RawColor`.

---

## 🎯 Milestone 4: Sistema Extensible de Marcas y Focos LED

### Issue #6: Formalizar esquema de configuración y fábrica de adaptadores de focos
- **Labels**: `refactor`, `hardware-adapter`, `priority:medium`
- **Estado**: Por implementar
- **Descripción**:
  Al incorporar un foco nuevo de cualquier marca, debe bastar con crear `config/lights/<nombre_foco>.yaml` definiendo sus características (potencia lumínica, curvas gamma, modos soportados: RGB, RGBW, CCT). Si la marca usa un protocolo especial de Home Assistant, debe asociarse a su driver en `lights/`.
- **Criterios de Aceptación**:
  - [ ] Esquema YAML validado (ej. usando schema validator o dataclasses estrictas).
  - [ ] Soporte de calibración individual de offsets de color y límites de brillo (min/max).
  - [ ] Documentación clara para agregar una marca nueva en menos de 5 pasos.

---

## 🎯 Milestone 5: Interfaz Gráfica Local (UI de Gestión y Calibración)

### Issue #7: Servidor local ligero y API de configuración (FastAPI / Flask)
- **Labels**: `ui`, `backend`, `priority:medium`
- **Estado**: Por implementar
- **Descripción**:
  Exponer endpoints REST/WebSocket locales para:
  1. Conmutar encendido/apagado del motor Ambilight.
  2. Leer y escribir configuraciones de focos y zonas.
  3. Emitir color y estado en tiempo real para visualización.
- **Criterios de Aceptación**:
  - [ ] Endpoints `/api/status`, `/api/lights`, `/api/layouts`, `/api/control`.
  - [ ] Persistencia directa a los archivos YAML de configuración.

---

### Issue #8: Conectar pantallas de diseño existentes a la API local
- **Labels**: `ui`, `frontend`, `priority:medium`
- **Estado**: Por implementar
- **Descripción**:
  Aprovechar los mockups HTML en `Diseño Pantallas/` (`dashboard_multi_foco.html`, `gestion_de_focos.html`, `distribucion_y_grupos.html`, `configuracion_individual.html`) conectándolos con el backend local sin sobrecargar con librerías pesadas.
- **Criterios de Aceptación**:
  - [ ] Visualizador de pantalla con selector interactivo de zonas (Full, 2, 3, 4, etc.).
  - [ ] Drag & drop o selector de focos asignados a cada región.
  - [ ] Sliders de calibración en vivo para observar cambios inmediatos en las luces.

---

## 🎯 Milestone 6: Infraestructura y Migración a Docker

### Issue #9: Despliegue de Home Assistant en Docker Compose
- **Labels**: `devops`, `docker`, `priority:low`
- **Estado**: Por implementar (última fase)
- **Descripción**:
  Reemplazar la máquina virtual de Home Assistant por un contenedor Docker persistente y liviano para evitar levantar la VM en cada inicio.
- **Criterios de Aceptación**:
  - [ ] Archivo `docker-compose.yml` con configuración de red `host` (esencial para auto-discovery de dispositivos WiZ / mDNS en LAN).
  - [ ] Mapeo de volumen local persistente para `/config`.
  - [ ] Guía paso a paso de migración de integraciones, entidades y tokens.
