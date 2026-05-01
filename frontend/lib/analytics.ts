/**
 * Analytics — single entry point for all event tracking.
 * Uses PostHog if NEXT_PUBLIC_POSTHOG_KEY is set; no-ops otherwise (safe in dev).
 *
 * Events are intentionally narrow and funnel-focused. Add new events sparingly.
 */
'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  if (initialized) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    persistence: 'localStorage+cookie',
  });
  initialized = true;
}

type FunnelEvent =
  | 'teaser_started'
  | 'teaser_completed'
  | 'teaser_failed'
  | 'plan_selected'
  | 'payment_initiated'
  | 'payment_completed'
  | 'order_completed'
  | 'resume_downloaded'
  | 'whatsapp_share_clicked'
  | 'upgrade_clicked'
  | 'feedback_submitted';

export function track(event: FunnelEvent, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!initialized) return;
  try {
    posthog.capture(event, properties);
  } catch {}
}

export function identify(email: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!initialized) return;
  try {
    posthog.identify(email, properties);
  } catch {}
}
