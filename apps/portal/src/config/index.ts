// apps/portal/src/config/index.ts
import { genericConfig } from "./genericConfig";
import { campusSoundConfig } from "./campusSoundConfig";
import { techStartupConfig } from "./techStartupConfig";
import { fitnessClubConfig } from "./fitnessClubConfig";
import { PortalConfig } from "./types";

export type PresetKey = "generic" | "campus-sound" | "tech-startup" | "fitness-club";

export function getStaticConfig(preset: PresetKey = "generic"): PortalConfig {
  if (preset === "campus-sound") return campusSoundConfig;
  if (preset === "tech-startup") return techStartupConfig;
  if (preset === "fitness-club") return fitnessClubConfig;
  return genericConfig;
}

export * from "./types";
