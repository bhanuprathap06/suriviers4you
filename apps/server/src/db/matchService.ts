import { prisma } from "./client";

export interface MatchData {
  inviteCode: string;
  result: string;
  duration: number;
  objectivesCompleted: number;
  totalObjectives: number;
  extractedCount: number;
  totalPlayers: number;
  difficulty: string;
  participants: {
    displayName: string;
    status: string;
    damage: number;
    revives: number;
  }[];
}

export async function saveMatch(data: MatchData): Promise<string> {
  try {
    const match = await prisma.match.create({
      data: {
        inviteCode: data.inviteCode,
        result: data.result,
        duration: data.duration,
        objectivesCompleted: data.objectivesCompleted,
        totalObjectives: data.totalObjectives,
        extractedCount: data.extractedCount,
        totalPlayers: data.totalPlayers,
        difficulty: data.difficulty,
        participants: {
          create: data.participants.map((p) => ({
            status: p.status,
            damage: p.damage,
            revives: p.revives,
            player: {
              connectOrCreate: {
                where: { id: p.displayName },
                create: {
                  id: p.displayName,
                  displayName: p.displayName,
                },
              },
            },
          })),
        },
      },
    });
    return match.id;
  } catch (err) {
    console.error("Failed to save match:", err);
    return "";
  }
}

export async function getRecentMatches(limit = 10) {
  try {
    return await prisma.match.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { participants: { include: { player: true } } },
    });
  } catch {
    return [];
  }
}
