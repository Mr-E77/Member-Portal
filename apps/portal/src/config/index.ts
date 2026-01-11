// apps/portal/src/config/index.ts
import { genericConfig } from "./genericConfig";
import { campusSoundConfig } from "./campusSoundConfig";
import { PortalConfig } from "./types";

export type PresetKey = "generic" | "campus-sound";

export function getStaticConfig(preset: PresetKey = "generic"): PortalConfig {
  if (preset === "campus-sound") return campusSoundConfig;
  return genericConfig;
}

export * from "./types";
