import { z } from 'zod';
import { companionPackSchema, chapterSchema, blockSchema } from './schema/companion-pack';

export type CompanionPack = z.infer<typeof companionPackSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type Block = z.infer<typeof blockSchema>;
export type ExplainerBlock = Extract<Block, { type: 'explainer' }>;
export type TermBlock = Extract<Block, { type: 'term' }>;
export type TipBlock = Extract<Block, { type: 'tip' }>;
