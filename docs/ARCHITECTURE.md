# Arquitectura Técnica — Ambilight Modular (Screen Color and Lights)

## 1. Visión y Propósito
Sistema Ambilight local para Windows que evoluciona hacia una **WebApp completa**. Captura la pantalla en tiempo real (completa o segmentada en zonas), calcula el color predominante y reproduce los estados de luz en focos inteligentes vía la API REST de Home Assistant, adaptándose a las capacidades y marcas de cada luminaria.

La plataforma permite operarse localmente en la máquina anfitriona y conectarse remotamente desde cualquier dispositivo de la red local (navegador web en PC, tablet o celular) a modo de WebApp moderna.

---

## 2. Definición del Stack Tecnológico Recomendado

Para lograr una WebApp moderna a largo plazo sin quebrar el rendimiento de captura de pantalla en Windows, la arquitectura separa **Motor + API** de la **Interfaz de Usuario**:

```
┌────────────────────────────────────────────────────────┐
│               FRONTEND: WebApp (Next.js)              │
│  • React 19 + Next.js (App Router)                     │
│  • Tailwind CSS + Lucide Icons + Shadcn/ui            │
│  • WebSockets para preview de color y estado en vivo   │
│  • PWA (Progressive Web App): instalable en móvil/PC  │
└───────────────────────────▲────────────────────────────┘
                            │ REST + WebSockets
┌───────────────────────────▼────────────────────────────┐
│              BACKEND / API: FastAPI (Python)           │
│  • FastAPI + Uvicorn (asíncrono, ultraliviano)        │
│  • Endpoints REST para configuración y CRUD de focos   │
│  • WebSocket endpoint para streaming de FPS/colores    │
│  • Pydantic para validación estricta de esquemas YAML  │
└───────────────────────────▲────────────────────────────┘
                            │ Proceso / Threads
┌───────────────────────────▼────────────────────────────┐
│           ENGINE: Ambilight Core Engine (Python)       │
│  • mss (captura directa DirectX en Windows)            │
│  • Pillow / NumPy (procesamiento y recorte de zonas)   │
│  • Requests / aiohttp (despacho a Home Assistant REST) │
│  • Adaptadores de marca (WiZ, genéricos RGB, CCT...)   │
└────────────────────────────────────────────────────────┘
```

### ¿Por qué este Stack?
1. **Frontend con Next.js + React**:
   - Permite una experiencia interactiva fluida para diagramar las zonas de la pantalla (drag & drop, sliders de calibración en vivo, visualización de colores detectados).
   - Puede compilarse como aplicación web accesible desde la red local (`http://192.168.x.x:3000`) o compilarse como export estático si se desea servir directo desde el backend.
   - Posibilidad de convertirlo en PWA para abrirlo desde el teléfono como una app nativa en el hogar.
2. **Backend con FastAPI (Python)**:
   - **Cero fricción con el motor**: Tanto la captura (`mss`), el análisis de imagen (`NumPy`/`Pillow`) como el cliente de Home Assistant ya están en Python. Reescribir el motor en Node provocaría pérdidas de rendimiento en captura de pantalla nativa de Windows.
   - **WebSockets nativos**: Envía el color detectado y los FPS en tiempo real al frontend Next.js sin overhead.
   - **Documentación automática**: Swagger/OpenAPI listo para probar (`/docs`).

---

## 3. Principios de Diseño
1. **Desacoplamiento Estricto**:
   - **Captura ≠ Región**: El capturador obtiene frames; el particionador extrae regiones rectangulares relativas.
   - **Región ≠ Foco**: Una región emite un color analizado; uno o más focos pueden suscribirse a esa región.
   - **Marca/Modelo ≠ Protocolo**: Cada luminaria tiene capacidades declaradas (`rgb`, `rgbw`, `cct`, `gamma`, calibraciones) y produce payloads HA según su clase adaptadora.
   - **Motor ≠ Interfaz**: El motor corre como proceso de servicio desacoplado de la UI de configuración.
2. **Seguridad First**:
   - Secretos (URLs de red local, tokens HA de larga duración) nunca se guardan en archivos versionados por Git.
   - Se utiliza plantilla de configuración (`global.example.yaml` o variables `.env`).
3. **Simplicidad Operativa**:
   - Configuración declarativa en YAML por foco y por layout de pantalla.
   - Fácil extensión: para sumar un foco se añade un YAML y, si es un tipo nuevo, una clase en `lights/`.

---

## 4. Estructura de Módulos Proyectada

```text
├── ambilight-core/          # Motor y backend API
│   ├── capture/
│   │   ├── screen.py        # Captura cruda mediante mss
│   │   └── regions.py       # Definición matemática y recorte de zonas (0.0 - 1.0)
│   ├── color/
│   │   ├── dominant.py      # Extracción de color predominante ignorando franjas negras
│   │   └── temperature.py   # Conversión o umbral a temperatura Kelvin / CCT
│   ├── engine/
│   │   ├── ambilight.py     # Orquestador del bucle principal y despacho concurrente
│   │   └── mapping.py       # Vinculación dinámica zona -> foco
│   ├── lights/
│   │   ├── base.py          # Clase abstracta Light y definición de LightCommand
│   │   ├── wiz_rgbw.py      # Driver específico WiZ con CCT para blancos
│   │   └── generic_rgb.py   # Driver genérico RGB con ajuste gamma
│   ├── ha/
│   │   └── client.py        # Cliente REST para llamadas a /api/services/light/*
│   ├── api/
│   │   ├── server.py        # FastAPI app (REST + WebSockets)
│   │   ├── routers/         # Rutas: /lights, /zones, /engine, /config
│   │   └── schemas/         # Modelos Pydantic
│   └── config/
│       ├── global.example.yaml
│       ├── lights/          # YAMLs individuales por foco
│       └── layouts/         # Perfiles de partición de pantalla
│
├── webapp/                  # Frontend Next.js + React
│   ├── src/
│   │   ├── app/             # Rutas App Router (Dashboard, Dispositivos, Zonas, Calibración)
│   │   ├── components/      # Componentes UI (ScreenPreview, LightCard, ColorPicker, Sliders)
│   │   └── lib/             # Cliente API REST y conexión WebSocket
│   ├── package.json
│   └── tailwind.config.ts
│
└── docs/
    ├── ARCHITECTURE.md      # Este documento
    └── ISSUES_BACKLOG.md    # Backlog detallado simulando issues de GitHub
```

---

## 5. Roadmap por Fases
- **Fase 1: Estabilización, Seguridad y Verificación** (probar base actual, aislar secretos, validar conectividad).
- **Fase 2: Motor de Zonas y Captura Particionada** (Full, 2 verticales, 3, 4 cuadrantes/esquinas, asignación zona-foco).
- **Fase 3: Algoritmo Robusto de Color Predominante** (reemplazo de promedio RGB, descarte de bandas negras).
- **Fase 4: Adaptadores Modulares de Nuevas Marcas y Calibración** (archivos YAML por foco, soporte n focos).
- **Fase 5: Backend API con FastAPI y WebSockets** (control del motor, CRUD de configuraciones y streaming de estado).
- **Fase 6: Frontend WebApp con Next.js + Tailwind** (UI interactiva, visualizador de zonas y control remoto).
- **Fase 7: Infraestructura Docker** (reemplazo de Home Assistant VM por contenedor persistente).

---

## 6. Ideas Futuras y Expansión del Proyecto (Backlog Exploratorio)

### A. Conexión Directa a Focos por Dirección MAC / UDP Local (Bypass de Home Assistant)
- **Concepto**: Permitir que el motor de Ambilight envíe paquetes directamente a la IP/MAC del foco en la red local (por ejemplo mediante el protocolo local UDP que utilizan los focos WiZ en el puerto `38899`, o protocolos BLE/Matter locales).
- **Ventajas**:
  - **Latencia ultra-baja**: Elimina el intermediario HTTP de Home Assistant, reduciendo la latencia de ~30-50ms a <5ms.
  - **Independencia**: El Ambilight puede funcionar incluso si Home Assistant está apagado o en mantenimiento.
  - **Modo Híbrido**: Control rápido directo para Ambilight en tiempo real, manteniendo Home Assistant para automatizaciones del hogar.

### B. Sistema Simplificado y Rápido de Gestión del Hogar (Custom Home Dashboard)
- **Concepto**: Extender la WebApp no solo como Ambilight de pantalla, sino como un **centro de control lumínico para toda la casa**:
  - Encendido/apagado rápido por habitaciones (Living, Pieza, Escritorio).
  - Escenas predefinidas con un click (Modo Película, Modo Lectura, Modo Noche, Luz de Trabajo).
  - Interfaz ultraliviana pensada para celulares y tablets montadas en pared.

### C. Publicación como Proyecto Open Source en GitHub
- **Concepto**: Diseñar el código con estándares de proyecto público y reutilizable por la comunidad:
  - Cero datos 'hardcodeados' de la casa particular (todo parametrizado por YAML / variables de entorno).
  - Documentación de instalación en 1 comando (`docker compose up` + `npm run dev`).
  - Guía de contribución para que otros usuarios sumen drivers de nuevas marcas (Philips Hue, Tuya/SmartLife, Yeelight, Govee).

### D. Virtualización de Home Assistant en Docker / Contenedores Ligeros
- **Concepto**: Reemplazar la máquina virtual pesada (VirtualBox / VMware) por un contenedor Docker persistente en Windows (WSL2) o en un mini-PC/servidor local.
- **Ventajas**: Menor consumo de RAM/CPU, inicio automático con el sistema operativo y respaldos directos del volumen `/config`.

