# Backlog de Implementación (Simulación de Issues de GitHub)

Este documento simula los issues de GitHub organizados por hitos (Milestones) y etiquetas (labels), listos para ejecutarse de forma iterativa y trazable.

---

## 🎯 Milestone 1: Hardening, Seguridad y Verificación Base

### Issue #1: Proteger secretos y credenciales de Home Assistant en configuración
- **Labels**: `security`, `configuration`, `priority:critical`
- **Estado**: ✅ Completado (commit inicial)
- **Descripción**:
  `config/global.yaml` contenía un Long-Lived Token y la URL interna de Home Assistant en texto plano.
- **Criterios de Aceptación**:
  - [x] Crear `config/global.example.yaml` con valores ficticios.
  - [x] Añadir `config/global.yaml` y `.env` a `.gitignore`.
  - [x] Confirmar que ningún token real queda registrado en el historial de Git.

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
  Actualmente `capture_screen` solo obtiene el promedio de toda la pantalla. Se requiere una abstracción matemática que permita definir zonas mediante coordenadas normalizadas (0.0 a 1.0) y extraer sub-imágenes en un solo frame.
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

## 🎯 Milestone 5: Backend API con FastAPI y WebSockets

### Issue #7: Implementar servidor API FastAPI y WebSockets para streaming de estado
- **Labels**: `backend`, `api`, `fastapi`, `priority:high`
- **Estado**: Por implementar
- **Descripción**:
  Crear una capa de servicio API desacoplada del motor para permitir el control de la WebApp vía REST y WebSockets.
- **Endpoints a exponer**:
  - `POST /api/engine/start`: Iniciar bucle Ambilight con el layout activo.
  - `POST /api/engine/stop`: Detener bucle y apagar focos de forma segura.
  - `GET /api/engine/status`: Estado del motor (corriendo, detenido, FPS, latencia).
  - `GET /api/lights`: Listado de focos registrados y su estado actual en Home Assistant.
  - `POST /api/lights`: Registrar o editar configuración de un foco individual (YAML).
  - `GET /api/layouts`: Listado de layouts de partición de pantalla.
  - `POST /api/layouts/active`: Cambiar el layout activo (Full, 2 zonas, 4 zonas, etc.).
  - `WS /ws/live-stream`: Canal WebSocket para emitir a la WebApp el color detectado por zona y los valores enviados a cada foco en tiempo real.
- **Criterios de Aceptación**:
  - [ ] Servidor FastAPI ejecutable con Uvicorn.
  - [ ] Documentación OpenAPI interactiva disponible en `/docs`.
  - [ ] Control thread-safe del ciclo de vida del motor `AmbilightEngine`.

---

## 🎯 Milestone 6: Frontend WebApp con Next.js + React

### Issue #8: Inicializar proyecto WebApp en Next.js con Tailwind CSS y componentes base
- **Labels**: `frontend`, `nextjs`, `react`, `priority:medium`
- **Estado**: Por implementar
- **Descripción**:
  Estructurar el frontend en la carpeta `webapp/` con Next.js (App Router), Tailwind CSS y biblioteca de iconos (Lucide React), integrando diseño responsivo y PWA para acceso desde teléfonos/tablets en la red local.
- **Criterios de Aceptación**:
  - [ ] Proyecto Next.js configurado con TypeScript y Tailwind.
  - [ ] Cliente API configurado para conectarse al backend FastAPI (`NEXT_PUBLIC_API_URL`).
  - [ ] Conexión WebSocket para consumo reactivo del stream de colores.

---

### Issue #9: Pantalla interactiva de Distribución Espacial de Pantalla y Asignación de Luces
- **Labels**: `frontend`, `nextjs`, `ux`, `priority:high`
- **Estado**: Por implementar
- **Descripción**:
  Reemplazar el prototipo estático `Diseño Pantallas/distribucion_y_grupos.html` por una pantalla interactiva en React que muestre la pantalla del monitor dividida según el modo seleccionado (Full, 2 zonas, 3 zonas, 4 cuadrantes, perímetro) y permita asociar focos a cada zona.
- **Criterios de Aceptación**:
  - [ ] Selector visual de modo de partición.
  - [ ] Canvas o grid interactivo donde cada región muestra el color detectado en vivo vía WebSocket.
  - [ ] Asignación drag-and-drop o dropdown de qué foco o grupo de focos ilumina cada zona.
  - [ ] Botón de "Aplicar layout" que persista la configuración en el backend.

---

### Issue #10: Dashboard de Monitoreo y Calibración Individual de Focos
- **Labels**: `frontend`, `nextjs`, `ux`, `priority:medium`
- **Estado**: Por implementar
- **Descripción**:
  Portar `dashboard_multi_foco.html` y `configuracion_individual.html` a componentes React en Next.js:
  1. Card por foco con switch on/off, selector de modo (Sync, Estático, CCT).
  2. Panel de calibración con sliders interactivos (ganancia Red, Green, Blue, gamma, brillo min/max, umbral blanco CCT).
  3. Previsualizador de color real del foco contra el color muestreado de la pantalla.
- **Criterios de Aceptación**:
  - [ ] Sliders con debounce para no saturar requests a la API.
  - [ ] Feedback visual instantáneo.
  - [ ] Guardado automático o botón de guardar en el YAML del foco correspondiente.

---

## 🎯 Milestone 7: Infraestructura y Migración a Docker

### Issue #11: Despliegue de Home Assistant en Docker Compose
- **Labels**: `devops`, `docker`, `priority:low`
- **Estado**: Por implementar (última fase)
- **Descripción**:
  Reemplazar la máquina virtual de Home Assistant por un contenedor Docker persistente y liviano para evitar levantar la VM en cada inicio.
- **Criterios de Aceptación**:
  - [ ] Archivo `docker-compose.yml` con configuración de red `host` (esencial para auto-discovery de dispositivos WiZ / mDNS en LAN).
  - [ ] Mapeo de volumen local persistente para `/config`.
  - [ ] Guía paso a paso de migración de integraciones, entidades y tokens.
