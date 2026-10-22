export interface LightCalibration {
  brightness_min: number;
  brightness_max: number;
  brightness_multiplier?: number;
  gamma?: number;
  red_correction: number;
  green_correction: number;
  blue_correction: number;
  cct_white_threshold?: number;
  cct_cold_white?: number;
  off_threshold: number;
  color_change_threshold: number;
}

export interface LightCapabilities {
  rgb: boolean;
  rgbw: boolean;
  cct: boolean;
  min_kelvin?: number;
  max_kelvin?: number;
}

export interface LightItem {
  id: string;
  name: string;
  brand: string;
  type: string;
  entity_id: string;
  enabled: boolean;
  mode: "sync" | "static" | "cct";
  current_color: [number, number, number];
  current_brightness: number;
  current_kelvin?: number;
  assigned_zone?: string;
  capabilities: LightCapabilities;
  calibration: LightCalibration;
}

export type PartitionMode =
  | "full"
  | "split_2_vertical"
  | "split_3_vertical"
  | "quadrants_4"
  | "monitor_backlight";

export interface ScreenZone {
  id: string;
  name: string;
  rect: { x: number; y: number; width: number; height: number }; // 0.0 - 1.0
  color: [number, number, number];
  assigned_light_ids: string[];
}
