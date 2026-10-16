import { z } from "zod";

export const MoveInputSchema = z.object({
  seq: z.number().int().nonnegative(),
  dx: z.number().min(-1).max(1),
  dz: z.number().min(-1).max(1),
  rotY: z.number().min(-Math.PI * 2).max(Math.PI * 2),
  isSprinting: z.boolean(),
  isCrouching: z.boolean(),
  timestamp: z.number().positive(),
});

export const InteractSchema = z.object({
  targetId: z.string().min(1).max(64),
  targetType: z.enum(["door", "generator", "fuse_box", "extraction_panel", "item"]),
});

export const PickupSchema = z.object({
  itemId: z.string().min(1).max(64),
});

export const DropSchema = z.object({
  itemId: z.string().min(1).max(64),
});

export const UseItemSchema = z.object({
  itemId: z.string().min(1).max(64),
  targetId: z.string().min(1).max(64).optional(),
});

export const ReviveSchema = z.object({
  targetPlayerId: z.string().min(1).max(64),
});

export const ReadySchema = z.object({
  isReady: z.boolean(),
});

export const StartGameSchema = z.object({
  config: z
    .object({
      difficulty: z.enum(["normal", "hard", "nightmare"]).optional(),
      missionDuration: z.number().int().min(120).max(1800).optional(),
    })
    .optional(),
});

export const ChatSchema = z.object({
  text: z.string().min(1).max(200).trim(),
});

export const PlayerNameSchema = z
  .string()
  .min(1)
  .max(24)
  .regex(/^[a-zA-Z0-9_\- ]+$/);
