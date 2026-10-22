const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchApi(path: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] Fallback for ${path}:`, err);
    return null;
  }
}

export async function getEngineStatus() {
  return await fetchApi("/api/status");
}

export async function toggleEngine(action: "start" | "stop" | "toggle") {
  return await fetchApi("/api/engine/control", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export async function getRegisteredLights() {
  return await fetchApi("/api/lights");
}

export async function toggleLightPowerApi(lightId: string, state: boolean) {
  return await fetchApi(`/api/lights/${lightId}/power`, {
    method: "POST",
    body: JSON.stringify({ state }),
  });
}

export async function saveLightCalibrationApi(lightId: string, calibration: any) {
  return await fetchApi(`/api/lights/${lightId}/calibrate`, {
    method: "POST",
    body: JSON.stringify(calibration),
  });
}

export async function updateLayoutApi(layoutName: string, zoneMappings?: Record<string, string>) {
  return await fetchApi("/api/layouts/select", {
    method: "POST",
    body: JSON.stringify({
      layout_name: layoutName,
      zone_mappings: zoneMappings,
    }),
  });
}
