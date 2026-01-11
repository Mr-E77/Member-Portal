// apps/portal/src/lib/configLoader.ts
import { prisma } from "./prisma";
import { PortalConfig } from "@/config/types";
import { genericConfig } from "@/config/genericConfig";

export async function loadPortalConfig(
  id?: string
): Promise<PortalConfig> {
  if (!id) return genericConfig;

  const record = await prisma.portalConfigModel.findUnique({
    where: { id }
  });

  if (!record) return genericConfig;

  return record.data as PortalConfig;
}
