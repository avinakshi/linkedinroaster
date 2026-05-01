/**
 * Centralized Zod request schemas for high-traffic POST endpoints.
 * Use `parseBody(schema, req.body)` at the top of each handler — returns
 * { ok: true, data } on success, { ok: false, errors } on failure.
 *
 * Adds defense-in-depth on top of existing ad-hoc validation: type checks,
 * length limits, and shape verification all run BEFORE any business logic.
 */
import { z } from 'zod';

const inputSourceEnum = z.enum(['resume', 'linkedin', 'questionnaire', 'student']);

// ── /api/teaser ───────────────────────────────────────────────────
export const teaserBodySchema = z.object({
  headline: z.string().min(10, 'Please paste your LinkedIn headline (at least 10 characters).')
    .max(500, 'Headline is too long. Paste only your LinkedIn headline, not your full profile.')
    .refine(
      v => /[a-zA-Zऀ-ॿ]/.test(v),
      'Please paste your actual LinkedIn headline.',
    ),
  input_source: inputSourceEnum.optional(),
  target_role: z.string().max(200).optional().nullable(),
});

// ── /api/orders ───────────────────────────────────────────────────
const profileDataSchema = z.object({
  headline: z.string().max(500).optional(),
  about: z.string().max(5000).optional(),
  experience: z.string().max(20000).optional(),
  raw_paste: z.string().max(50000).optional(),
}).passthrough();

export const orderBodySchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  plan: z.enum(['standard', 'pro']),
  profile_data: profileDataSchema.optional(),
  job_description: z.string().max(20000).optional(),
  teaser_id: z.union([z.string().uuid(), z.number().int()]).optional(),
  input_source: inputSourceEnum.optional(),
  target_role: z.string().max(200).optional(),
});

// ── Generic helper ────────────────────────────────────────────────
export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): ParseResult<T> {
  const result = schema.safeParse(body);
  if (result.success) return { ok: true, data: result.data };
  const errors = result.error.issues.map(i => {
    const path = i.path.join('.');
    return path ? `${path}: ${i.message}` : i.message;
  });
  return { ok: false, errors };
}
