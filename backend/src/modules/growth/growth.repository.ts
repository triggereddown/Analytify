import { prisma } from "../../config/prisma.js";
import type { GrowthArea, GrowthCheckIn } from "../../generated/prisma/client.js";

export type GrowthAreaWithCheckIns = GrowthArea & { checkIns: GrowthCheckIn[] };

export const createGrowthArea = (userId: string, name: string): Promise<GrowthArea> =>
  prisma.growthArea.create({ data: { userId, name } });

export const findGrowthAreaById = (id: string, userId: string): Promise<GrowthArea | null> =>
  prisma.growthArea.findFirst({ where: { id, userId } });

export const findGrowthAreaByName = (userId: string, name: string): Promise<GrowthArea | null> =>
  prisma.growthArea.findFirst({ where: { userId, name } });

export const archiveGrowthArea = (id: string): Promise<GrowthArea> =>
  prisma.growthArea.update({ where: { id }, data: { archivedAt: new Date() } });

/**
 * Active growth areas with check-ins in [startDate, endDate] — powers both
 * the "Today's Growth" dashboard card (single-day range) and any future
 * weekly view, without duplicating the query shape.
 */
export const findActiveGrowthAreasWithCheckIns = (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<GrowthAreaWithCheckIns[]> =>
  prisma.growthArea.findMany({
    where: { userId, archivedAt: null },
    include: {
      checkIns: {
        where: { checkedDate: { gte: startDate, lte: endDate } },
        orderBy: { checkedDate: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

export const upsertCheckIn = (
  growthAreaId: string,
  checkedDate: string,
  minutes: number | null,
  note: string | null,
): Promise<GrowthCheckIn> =>
  prisma.growthCheckIn.upsert({
    where: { growthAreaId_checkedDate: { growthAreaId, checkedDate } },
    create: { growthAreaId, checkedDate, minutes, note },
    update: { minutes, note },
  });

export const deleteCheckIn = (growthAreaId: string, checkedDate: string): Promise<GrowthCheckIn> =>
  prisma.growthCheckIn.delete({
    where: { growthAreaId_checkedDate: { growthAreaId, checkedDate } },
  });

/** All check-in dates for an area, ascending — used to compute a streak. */
export const findCheckInDatesForArea = async (growthAreaId: string): Promise<string[]> => {
  const checkIns = await prisma.growthCheckIn.findMany({
    where: { growthAreaId },
    select: { checkedDate: true },
    orderBy: { checkedDate: "asc" },
  });
  return checkIns.map((c) => c.checkedDate);
};
