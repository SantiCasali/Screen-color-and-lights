# Arquitectura Técnica — Ambilight Modular (Screen Color and Lights)

## 1. Visión y Propósito
Sistema Ambilight local en Python para Windows. Captura la pantalla en tiempo real (completa o segmentada en zonas), calcula el color predominante y reproduce los estados de luz en focos inteligentes vía la API REST de Home Assistant, adaptándose a las capacidades y marcas de cada luminaria.

---

## 2. Principios de Diseño
1. **Desacoplamiento Estricto**:
   - **Captura ≠ Región**: El capturador obtiene frames; el particionador extrae regiones rectangulares relativas.
   - **Región ≠ Foco**: Una región emite un color analizado; uno o más focos pueden suscribirse a esa región.
   - **Marca/Modelo ≠ Protocolo**: Cada luminaria tiene capacidades declaradas (`rgb`, `rgbw`, `cct`, `gamma`, calibraciones) y produce payloads HA según su clase adaptadora.
   - **Motor ≠ Interfaz**: El motor corre como proceso de servicio/CLI desacoplado de la UI de configuración.
2. **Seguridad First**:
   - Secretos (URLs de red local, tokens HA de larga duración) nunca se guardan en archivos versionados por Git.
   - Se utiliza plantilla de configuración (`global.example.yaml` o variables `.env`).
3. **Simplicidad Operativa**:
   - Configuración declarativa en YAML por foco y por layout de pantalla.
   - Fácil extensión: para sumar un foco se añade un YAML y, si es un tipo nuevo, una clase en `lights/`.

---

## 3. Modelo de Dominio y Capas

```
[ Monitor Windows ]
         │ (mss)
         ▼
[ Capture Pipeline ] ────> Particionador de Regiones (Full / 2 / 3 / 4 / Custom)
         │
         ▼
[ Color Analysis Engine ] ─> Filtro de negros / Cuantización / Dominante / CCT
         │
         ▼
[ Light Dispatcher & Mapping ] ─> Asocia Zona(s) -> Foco(s)
         │
         ▼
[ Light Adapters (WiZ RGBW, Generic RGB, CCT...) ] ─> Calibración, Brillo & Modo
         │
         ▼
[ Home Assistant REST Client ]
         │
         ▼
[ Home Assistant (VM actual -> Docker a futuro) ] ──> [ Focos Físicos ]
```

---

## 4. Estructura de Módulos Proyectada

```text
├── capture/
│   ├── screen.py            # Captura de pantalla cruda mediante mss
│   └── regions.py           # Definición matemática y recorte de zonas relativas (0.0 - 1.0)
├── color/
│   ├── dominant.py          # Extracción de color predominante ignorando franjas negras
│   └── temperature.py       # Conversión o umbral a temperatura Kelvin / CCT
├── engine/
│   ├── ambilight.py         # Orquestador del bucle principal y despacho concurrente
│   └── mapping.py           # Vinculación dinámica zona -> foco
├── lights/
│   ├── base.py              # Clase abstracta Light y definición de LightCommand
│   ├── wiz_rgbw.py          # Driver específico WiZ con CCT para blancos
│   └── generic_rgb.py       # Driver genérico RGB con ajuste gamma
├── ha/
│   └── client.py            # Cliente REST para llamadas a /api/services/light/*
├── config/
│   ├── global.example.yaml  # Plantilla de settings globales y credenciales
│   ├── lights/              # Archivos YAML individuales por foco
│   └── layouts/             # Perfiles de partición de pantalla
└── docs/
    ├── ARCHITECTURE.md      # Este documento
    └── ISSUES_BACKLOG.md    # Backlog detallado simulando issues de GitHub
```

---

## 5. Roadmap por Fases
- **Fase 1: Estabilización, Seguridad y Verificación** (probar base actual, aislar secretos, validar conectividad).
- **Fase 2: Motor de Zonas y Captura Particionada** (Full, 2 verticales, 3, 4 cuadrantes, asignación zona-foco).
- **Fase 3: Algoritmo Robusto de Color Predominante** (reemplazo de promedio RGB, descarte de bandas negras).
- **Fase 4: Adaptadores Modulares de Nuevas Marcas y Calibración** (archivos YAML por foco, soporte n focos).
- **Fase 5: Interfaz Gráfica / Panel Local** (dashboard, gestión de focos y asignación espacial).
- **Fase 6: Infraestructura Docker** (reemplazo de Home Assistant VM por contenedor persistente).
