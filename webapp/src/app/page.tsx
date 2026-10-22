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

  const selectedLight = lights.find((l) => l.id === selectedLightId) || lights[0];

  const toggleLightPower = (id: string) => {
    setLights((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
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

  const currentLayoutDef = LAYOUT_DEFINITIONS[activeLayout];

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

            {/* Visual Canvas of the Screen with assigned lights */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-slate-200">Asignación de Zonas y Luces</h3>
                  <p className="text-xs text-slate-400">
                    Modo: <span className="text-cyan-400 font-medium">{currentLayoutDef.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => alert("¡Configuración de zonas guardada en config/layouts/active.yaml!")}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition shadow"
                >
                  Guardar Layout Activo
                </button>
              </div>

              {/* Grid of zones with dropdown of lights */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {currentLayoutDef.zones.map((zone) => {
                  const [r, g, b] = zone.color;
                  return (
                    <div
                      key={zone.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                          />
                          <span className="font-semibold text-sm text-slate-200">{zone.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">ID: {zone.id}</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-medium">Foco Asociado:</label>
                        <select
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                          defaultValue={zone.assigned_light_ids[0] || ""}
                        >
                          <option value="">(Sin foco asignado)</option>
                          {lights.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name} ({l.entity_id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                        Coordenadas relativas: ({zone.rect.x}, {zone.rect.y}) a ({zone.rect.width}x{zone.rect.height})
                      </div>
                    </div>
                  );
                })}
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
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">
                    Calibración: {selectedLight.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Marca: {selectedLight.brand} · Entidad: {selectedLight.entity_id}
                  </p>
                </div>
                <button
                  onClick={() => alert(`Configuración de ${selectedLight.name} guardada en YAML!`)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition shadow"
                >
                  Guardar en config/lights/{selectedLight.id}.yaml
                </button>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Red Correction */}
                <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Corrección Rojo (Red)</span>
                    <span className="font-mono text-cyan-400">{selectedLight.calibration.red_correction}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={selectedLight.calibration.red_correction}
                    onChange={(e) =>
                      updateLightCalibration(selectedLight.id, "red_correction", parseFloat(e.target.value))
                    }
                    className="w-full accent-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">Multiplicador para compensar tono cálido/frío</p>
                </div>

                {/* Green Correction */}
                <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Corrección Verde (Green)</span>
                    <span className="font-mono text-cyan-400">{selectedLight.calibration.green_correction}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={selectedLight.calibration.green_correction}
                    onChange={(e) =>
                      updateLightCalibration(selectedLight.id, "green_correction", parseFloat(e.target.value))
                    }
                    className="w-full accent-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">Compensación del canal verde</p>
                </div>

                {/* Blue Correction */}
                <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Corrección Azul (Blue)</span>
                    <span className="font-mono text-cyan-400">{selectedLight.calibration.blue_correction}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="4.0"
                    step="0.1"
                    value={selectedLight.calibration.blue_correction}
                    onChange={(e) =>
                      updateLightCalibration(selectedLight.id, "blue_correction", parseFloat(e.target.value))
                    }
                    className="w-full accent-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">Vital para focos WiZ (suele requerir valor 2.5 - 3.0)</p>
                </div>

                {/* Gamma */}
                <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Curva Gamma</span>
                    <span className="font-mono text-cyan-400">{selectedLight.calibration.gamma || 0.6}</span>
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
                    className="w-full accent-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">Ajusta la luminosidad en tonos medios y oscuros</p>
                </div>

                {/* Brillo Mínimo */}
                <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Brillo Mínimo</span>
                    <span className="font-mono text-cyan-400">{selectedLight.calibration.brightness_min} / 255</span>
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
                    className="w-full accent-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">Evita parpadeos en intensidades muy bajas</p>
                </div>

                {/* Umbral Apagado */}
                <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Umbral Apagado (Pantalla Negra)</span>
                    <span className="font-mono text-cyan-400">{selectedLight.calibration.off_threshold}</span>
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
                    className="w-full accent-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">Apaga el foco automáticamente si la escena es oscura</p>
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
