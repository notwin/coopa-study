import { z } from 'zod';

export const cmsVideoSchema = z.object({
  webm: z.object({ url: z.string() }).passthrough().optional(),
  mp4: z.object({ url: z.string() }).passthrough().optional(),
  poster: z.object({ url: z.string() }).passthrough().optional(),
  subtitles: z.string().optional()
}).passthrough();

// 宽松 schema：只约束关键字段，剩下用 passthrough 保留
export const sitewideSchema = z.object({
  collection_id: z.literal('Sitewide'),
  seo: z.object({ title: z.string(), description: z.string() }).passthrough(),
  site_name: z.string(),
  footer: z.object({ links: z.array(z.object({ text: z.string(), url: z.string() })) }).passthrough()
}).passthrough();
