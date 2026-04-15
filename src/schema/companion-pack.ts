import { z } from 'zod';

const explainerBlock = z.object({
  type: z.literal('explainer'),
  title: z.string(),
  body: z.string()
});

const termBlock = z.object({
  type: z.literal('term'),
  term: z.string(),
  en: z.string(),
  definition: z.string(),
  analogy: z.string()
});

const tipBlock = z.object({
  type: z.literal('tip'),
  body: z.string()
});

export const blockSchema = z.discriminatedUnion('type', [explainerBlock, termBlock, tipBlock]);

export const chapterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  blocks: z.array(blockSchema).min(1)
});

export const companionPackSchema = z.object({
  questId: z.string().min(1),
  questTitle: z.string().min(1),
  version: z.string(),
  chapters: z.array(chapterSchema).min(1)
});
