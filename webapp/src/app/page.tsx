"use client";

import React, { useState } from "react";
import {
  Monitor,
  Lightbulb,
  Sliders,
  Settings2,
  Power,
  Layers,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { INITIAL_LIGHTS, LAYOUT_DEFINITIONS } from "@/lib/mockData";
import { LightItem, PartitionMode } from "@/types/ambilight";

export default function AmbilightWebApp() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "distribution" | "calibration" | "settings">("dashboard");
  const [engineRunning, setEngineRunning] = useState(true);
  const [lights, setLights] = useState<LightItem[]>(INITIAL_LIGHTS);
  const [selectedLightId, setSelectedLightId] = useState<string>("wiz_rgbw");
  const [activeLayout, setActiveLayout] = useState<PartitionMode>("split_2_vertical");
  const [layoutMap, setLayoutMap] = useState<Record<PartitionMode, typeof LAYOUT_DEFINITIONS[PartitionMode]>>(LAYOUT_DEFINITIONS);

  const selectedLight = lights.find((l) => l.id === selectedLightId) || lights[0];

  const toggleLightPower = (id: string) => {
    setLights((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const updateZoneLightAssignment = (mode: PartitionMode, zoneId: string, lightId: string) => {
    setLayoutMap((prev) => {
      const currentDef = prev[mode];
      const updatedZones = currentDef.zones.map((z) => {
        if (z.id === zoneId) {
          return {
            ...z,
            assigned_light_ids: lightId ? [lightId] : [],
          };
        }
        return z;
      });
      return {
        ...prev,
        [mode]: {
          ...currentDef,
          zones: updatedZones,
        },
      };
    });
  };

  const updateLightCalibration = (id: string, key: string, value: number) => {
    setLights((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        return {
          ...l,
          calibration: {
            ...l.calibration,
            [key]: value,
          },
        };
      })
    );
  };

  const currentLayoutDef = layoutMap[activeLayout];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">Ambilight Hub</h1>
            <p className="text-xs text-slate-400">Control & Calibración de Luces</p>
          </div>
        </div>

        {/* Global Engine State */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                engineRunning ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            />
            <span className="text-slate-300">
              {engineRunning ? "Motor Ambilight Activo (30 FPS)" : "Motor Pausado"}
            </span>
          </div>

          <button
            onClick={() => setEngineRunning(!engineRunning)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition shadow-lg ${
              engineRunning
                ? "bg-rose-600/90 hover:bg-rose-500 text-white shadow-rose-900/30"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{engineRunning ? "Pausar Motor" : "Iniciar Motor"}</span>
          </button>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="border-b border-slate-800/80 bg-slate-900/30 px-6 flex gap-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition ${
            activeTab === "dashboard"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("distribution")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition ${
            activeTab === "distribution"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Zonas & Pantalla</span>
        </button>

        <button
          onClick={() => setActiveTab("calibration")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition ${
            activeTab === "calibration"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Calibración Focos</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition ${
            activeTab === "settings"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Home Assistant</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ==================== TAB 1: DASHBOARD ==================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Live screen preview strip */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">Vista en Vivo del Ambilight</h2>
                  <p className="text-xs text-slate-400">
                    Modo activo: <span className="text-cyan-400">{currentLayoutDef.name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span>Sincronizando colores</span>
                </div>
              </div>

              {/* Dynamic simulated monitor screen with spatial positioning */}
              <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full rounded-xl bg-slate-950 border border-slate-700/60 overflow-hidden shadow-2xl">
                {currentLayoutDef.zones.map((zone) => {
                  const [r, g, b] = zone.color;
                  const isCornerGrid = activeLayout === "quadrants_4";
                  return (
                    <div
                      key={zone.id}
                      className="absolute transition-all duration-300 flex flex-col justify-between p-3 border border-slate-800/40"
                      style={{
                        left: `${zone.rect.x * 100}%`,
                        top: `${zone.rect.y * 100}%`,
                        width: `${zone.rect.width * 100}%`,
                        height: `${zone.rect.height * 100}%`,
                        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.22)`,
                        boxShadow: `inset 0 0 35px rgba(${r}, ${g}, ${b}, 0.35)`,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-700/70">
                          {zone.name}
                        </span>
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm"
                          style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                        />
                      </div>

                      <div className="bg-slate-900/80 backdrop-blur rounded px-2 py-1 text-[11px] text-slate-300 font-mono inline-block max-w-max border border-slate-800">
                        rgb({r}, {g}, {b})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lights Grid Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-200 text-sm">Focos Conectados ({lights.length})</h3>
                <button
                  onClick={() => setActiveTab("calibration")}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                >
                  <span>Ajustar calibración</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lights.map((light) => {
                  const [r, g, b] = light.current_color;
                  return (
                    <div
                      key={light.id}
                      className={`rounded-2xl border transition p-5 flex flex-col justify-between ${
                        light.enabled
                          ? "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                          : "bg-slate-950/60 border-slate-900 opacity-60"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center border transition shadow"
                              style={{
                                backgroundColor: light.enabled ? `rgb(${r}, ${g}, ${b})` : "#1e293b",
                                borderColor: light.enabled ? "rgba(255,255,255,0.2)" : "transparent",
                              }}
                            >
                              <Lightbulb
                                className={`w-5 h-5 ${
                                  light.enabled ? "text-white drop-shadow" : "text-slate-600"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-100 text-sm">{light.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{light.entity_id}</div>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleLightPower(light.id)}
                            className={`p-2 rounded-xl transition ${
                              light.enabled
                                ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                                : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium border border-slate-700/50">
                            {light.brand}
                          </span>
                          {light.capabilities.rgbw && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                              RGBW
                            </span>
                          )}
                          {light.capabilities.cct && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800/40">
                              CCT
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Brillo:</span>
                          <span className="font-semibold text-slate-200">
                            {Math.round((light.current_brightness / 255) * 100)}%
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedLightId(light.id);
                            setActiveTab("calibration");
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5"
                        >
                          <span>Calibrar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: DISTRIBUCIÓN Y ZONAS ==================== */}
        {activeTab === "distribution" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-semibold text-slate-100">Distribución Espacial de la Pantalla</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Seleccioná cómo se particiona el monitor y qué luces iluminan cada sector.
              </p>

              {/* Mode Selector Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
                {(Object.keys(LAYOUT_DEFINITIONS) as PartitionMode[]).map((modeKey) => {
                  const def = LAYOUT_DEFINITIONS[modeKey];
                  const isSelected = activeLayout === modeKey;
                  return (
                    <button
                      key={modeKey}
                      onClick={() => setActiveLayout(modeKey)}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? "bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950"
                          : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div>
                        <div
                          className={`font-semibold text-sm ${
                            isSelected ? "text-cyan-300" : "text-slate-200"
                          }`}
                        >
                          {def.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {def.description}
                        </div>
                      </div>
                      <div className="mt-3 text-[10px] text-slate-500 font-mono">
                        {def.zones.length} {def.zones.length === 1 ? "zona" : "zonas"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Canvas of the Screen with INTERACTIVE ON-SCREEN ASSIGNMENT */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <span>Configuración Visual sobre la Pantalla</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modo actual: <span className="text-cyan-400 font-semibold">{currentLayoutDef.name}</span>.
                    Podés elegir qué foco ilumina cada parte directamente adentro del monitor o en la lista inferior.
                  </p>
                </div>
                <button
                  onClick={() => alert(`¡Layout "${currentLayoutDef.name}" guardado exitosamente en YAML!`)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Guardar Layout</span>
                </button>
              </div>

              {/* The interactive monitor canvas */}
              <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full rounded-2xl bg-slate-950 border-2 border-slate-700/80 overflow-hidden shadow-2xl">
                {currentLayoutDef.zones.map((zone) => {
                  const [r, g, b] = zone.color;
                  const assignedLight = lights.find((l) => zone.assigned_light_ids.includes(l.id));

                  return (
                    <div
                      key={zone.id}
                      className="absolute transition-all duration-300 p-3 flex flex-col justify-between border-2 border-slate-700/60 hover:border-cyan-400/80 group"
                      style={{
                        left: `${zone.rect.x * 100}%`,
                        top: `${zone.rect.y * 100}%`,
                        width: `${zone.rect.width * 100}%`,
                        height: `${zone.rect.height * 100}%`,
                        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
                        boxShadow: `inset 0 0 45px rgba(${r}, ${g}, ${b}, 0.45)`,
                      }}
                    >
                      {/* Zone Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-100 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-700 shadow-sm flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/30"
                            style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                          />
                          {zone.name}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                          {Math.round(zone.rect.width * 100)}% x {Math.round(zone.rect.height * 100)}%
                        </span>
                      </div>

                      {/* Direct on-screen light selector */}
                      <div className="bg-slate-950/95 backdrop-blur-md rounded-xl p-2.5 border border-slate-700/80 shadow-2xl max-w-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 font-medium flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Foco en esta zona:</span>
                          </span>
                          {assignedLight && (
                            <span className="text-[10px] text-cyan-300 font-mono">
                              ({assignedLight.brand})
                            </span>
                          )}
                        </div>

                        <select
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
                          value={zone.assigned_light_ids[0] || ""}
                          onChange={(e) =>
                            updateZoneLightAssignment(activeLayout, zone.id, e.target.value)
                          }
                        >
                          <option value="">— Ninguno (Zona sin foco) —</option>
                          {lights.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Cards for detailed zone breakdown */}
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Resumen de Asignaciones por Zona
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {currentLayoutDef.zones.map((zone) => {
                    const assignedLight = lights.find((l) => zone.assigned_light_ids.includes(l.id));
                    const [r, g, b] = zone.color;
                    return (
                      <div
                        key={zone.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                            style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-200">{zone.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {assignedLight ? (
                                <span className="text-cyan-400 font-medium">{assignedLight.name}</span>
                              ) : (
                                <span className="text-slate-500 italic">Sin foco asignado</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <select
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                          value={zone.assigned_light_ids[0] || ""}
                          onChange={(e) =>
                            updateZoneLightAssignment(activeLayout, zone.id, e.target.value)
                          }
                        >
                          <option value="">(Ninguno)</option>
                          {lights.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: CALIBRACIÓN INDIVIDUAL ==================== */}
        {activeTab === "calibration" && (
          <div className="space-y-6">
            {/* Light Selector */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {lights.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLightId(l.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition border flex items-center gap-2 ${
                    selectedLightId === l.id
                      ? "bg-cyan-950/60 border-cyan-500 text-cyan-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{l.name}</span>
                </button>
              ))}
            </div>

            {/* Calibration Form Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-100">
                      Calibración: {selectedLight.name}
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {selectedLight.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Marca: <span className="text-slate-300">{selectedLight.brand}</span> · Entidad:{" "}
                    <span className="font-mono text-slate-300">{selectedLight.entity_id}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`Configuración de ${selectedLight.name} guardada en YAML!`)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
                  >
                    <span>Guardar YAML</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Live Color Preview of this Light */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-white/20 shadow-lg flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor: `rgb(${Math.min(
                        255,
                        Math.round(selectedLight.current_color[0] * selectedLight.calibration.red_correction)
                      )}, ${Math.min(
                        255,
                        Math.round(selectedLight.current_color[1] * selectedLight.calibration.green_correction)
                      )}, ${Math.min(
                        255,
                        Math.round(selectedLight.current_color[2] * selectedLight.calibration.blue_correction)
                      )})`,
                      boxShadow: `0 0 24px rgba(${selectedLight.current_color.join(",")}, 0.35)`,
                    }}
                  >
                    <Lightbulb className="w-6 h-6 text-white drop-shadow" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Previsualización con Calibración Aplicada</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      RGB compensado: [
                      {Math.min(
                        255,
                        Math.round(selectedLight.current_color[0] * selectedLight.calibration.red_correction)
                      )}
                      ,{" "}
                      {Math.min(
                        255,
                        Math.round(selectedLight.current_color[1] * selectedLight.calibration.green_correction)
                      )}
                      ,{" "}
                      {Math.min(
                        255,
                        Math.round(selectedLight.current_color[2] * selectedLight.calibration.blue_correction)
                      )}
                      ]
                    </div>
                  </div>
                </div>

                {/* Capability Badges with explanations */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Modo RGB Activo</span>
                  </div>
                  {selectedLight.capabilities.rgbw && (
                    <div className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span>Canal Blanco W</span>
                    </div>
                  )}
                  {selectedLight.capabilities.cct && (
                    <div className="px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-700 text-amber-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>CCT Kelvin ({selectedLight.capabilities.min_kelvin}K - {selectedLight.capabilities.max_kelvin}K)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Sliders Grid: Color Gains */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Canales de Color y Ganancia (RGB)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Red Correction Slider with Dynamic Red Gradient */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-red-950/40 hover:border-red-800/40 transition">
                    <div className="flex justify-between text-xs">
                      <span className="text-red-400 font-semibold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
                        Ganancia Canal Rojo
                      </span>
                      <span className="font-mono text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-900/50">
                        {selectedLight.calibration.red_correction.toFixed(2)}x
                      </span>
                    </div>
                    <div className="relative pt-1">
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.05"
                        value={selectedLight.calibration.red_correction}
                        onChange={(e) =>
                          updateLightCalibration(selectedLight.id, "red_correction", parseFloat(e.target.value))
                        }
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-950 via-red-600 to-red-400"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Compensa dominancia o déficit de tonos rojos</p>
                  </div>

                  {/* Green Correction Slider with Dynamic Green Gradient */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-emerald-950/40 hover:border-emerald-800/40 transition">
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
                        Ganancia Canal Verde
                      </span>
                      <span className="font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50">
                        {selectedLight.calibration.green_correction.toFixed(2)}x
                      </span>
                    </div>
                    <div className="relative pt-1">
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.05"
                        value={selectedLight.calibration.green_correction}
                        onChange={(e) =>
                          updateLightCalibration(selectedLight.id, "green_correction", parseFloat(e.target.value))
                        }
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-emerald-950 via-emerald-600 to-emerald-400"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Ajusta el tinte verde para balance neutro</p>
                  </div>

                  {/* Blue Correction Slider with Dynamic Blue Gradient */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-blue-950/40 hover:border-blue-800/40 transition">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500" />
                        Ganancia Canal Azul
                      </span>
                      <span className="font-mono text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/50">
                        {selectedLight.calibration.blue_correction.toFixed(2)}x
                      </span>
                    </div>
                    <div className="relative pt-1">
                      <input
                        type="range"
                        min="0.1"
                        max="4.0"
                        step="0.1"
                        value={selectedLight.calibration.blue_correction}
                        onChange={(e) =>
                          updateLightCalibration(selectedLight.id, "blue_correction", parseFloat(e.target.value))
                        }
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-950 via-blue-600 to-blue-400"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Crucial en focos WiZ (requiere ~2.5x - 3.0x para azules vivos)</p>
                  </div>
                </div>
              </div>

              {/* Dynamic White / CCT section: Rendered only if light supports CCT or RGBW */}
              {selectedLight.capabilities.cct && (
                <div className="space-y-3 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Calibración CCT y Detección de Blanco (Exclusivo WiZ / CCT)
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      Convierte grises desaturados a temperatura física en Kelvin
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CCT Kelvin Slider with Warm to Cold Gradient */}
                    <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-amber-950/40">
                      <div className="flex justify-between text-xs">
                        <span className="text-amber-300 font-medium">Blanco Neutro/Frío (Kelvin)</span>
                        <span className="font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                          {selectedLight.calibration.cct_cold_white || 6500}K
                        </span>
                      </div>
                      <div className="relative pt-1">
                        <input
                          type="range"
                          min={selectedLight.capabilities.min_kelvin || 2200}
                          max={selectedLight.capabilities.max_kelvin || 6500}
                          step="100"
                          value={selectedLight.calibration.cct_cold_white || 6500}
                          onChange={(e) =>
                            updateLightCalibration(selectedLight.id, "cct_cold_white", parseInt(e.target.value))
                          }
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-amber-500 via-orange-100 to-cyan-300"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Cálido ({selectedLight.capabilities.min_kelvin || 2200}K)</span>
                        <span>Frío ({selectedLight.capabilities.max_kelvin || 6500}K)</span>
                      </div>
                    </div>

                    {/* White Detection Threshold */}
                    <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-200 font-medium">Umbral Detección de Blanco (Δ RGB)</span>
                        <span className="font-mono text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-600">
                          {selectedLight.calibration.cct_white_threshold || 25}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="1"
                        value={selectedLight.calibration.cct_white_threshold || 25}
                        onChange={(e) =>
                          updateLightCalibration(selectedLight.id, "cct_white_threshold", parseInt(e.target.value))
                        }
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-slate-700 via-slate-300 to-white"
                      />
                      <p className="text-[10px] text-slate-500">
                        Si max(R,G,B) - min(R,G,B) &lt; umbral, se envía CCT para evitar blanco violeta
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Intensity, Gamma & Dynamic Behavior Sliders */}
              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Intensidad Lumínica y Comportamiento Físico
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gamma Curve Slider with White Line */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-medium">Curva Gamma</span>
                      <span className="font-mono text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-600">
                        {selectedLight.calibration.gamma || 0.6}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.05"
                      value={selectedLight.calibration.gamma || 0.6}
                      onChange={(e) =>
                        updateLightCalibration(selectedLight.id, "gamma", parseFloat(e.target.value))
                      }
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-slate-700 via-slate-300 to-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Menor a 1.0 realza luminosidad en escenas tenues; mayor comprime sombras
                    </p>
                  </div>

                  {/* Minimum Brightness Slider with White Line */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-medium">Brillo Mínimo de Encendido</span>
                      <span className="font-mono text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-600">
                        {selectedLight.calibration.brightness_min} / 255
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="200"
                      step="1"
                      value={selectedLight.calibration.brightness_min}
                      onChange={(e) =>
                        updateLightCalibration(selectedLight.id, "brightness_min", parseInt(e.target.value))
                      }
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-slate-700 via-slate-300 to-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Previene parpadeo o apagado involuntario del driver del foco
                    </p>
                  </div>

                  {/* Off Threshold (Black Screen) with White Line */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-medium">Umbral Apagado (Pantalla Negra)</span>
                      <span className="font-mono text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-600">
                        {selectedLight.calibration.off_threshold}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="1"
                      value={selectedLight.calibration.off_threshold}
                      onChange={(e) =>
                        updateLightCalibration(selectedLight.id, "off_threshold", parseInt(e.target.value))
                      }
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-slate-700 via-slate-300 to-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Si el brillo es menor a este valor, apaga la luz para negros reales
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: SETTINGS / HOME ASSISTANT ==================== */}
        {activeTab === "settings" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 max-w-2xl">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Conexión con Home Assistant</h2>
              <p className="text-xs text-slate-400">
                Configuración del endpoint REST de la máquina virtual o Docker.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300">URL de Home Assistant:</label>
                <input
                  type="text"
                  defaultValue="http://192.168.0.113:8123"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Long-Lived Access Token:</label>
                <input
                  type="password"
                  defaultValue="••••••••••••••••••••••••••••••••••••••••••••••••••••"
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => alert("Probando conexión...")}
                  className="border border-slate-700 hover:bg-slate-800 text-slate-200 font-medium text-xs px-4 py-2 rounded-xl transition"
                >
                  Probar Conexión
                </button>
                <button
                  type="button"
                  onClick={() => alert("Guardado en config/global.yaml local")}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition shadow"
                >
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
