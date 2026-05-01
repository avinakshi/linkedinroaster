'use client';

import React, { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { SaasMarketingHeader } from '../../../components/saas/SaasMarketingHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── ErrorBoundary — catches React render errors in children ───
class SafeRender extends Component<
  { name: string; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { name: string; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SafeRender] ${this.props.name} crashed:`, error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Types ───
interface ScoreBreakdown {
  headline: number;
  about: number;
  experience: number;
  completeness: number;
  ats?: number;
  overall: number;
}

interface RewrittenExperience {
  title: string;
  company: string;
  bullets: string[];
  changes_made: string;
}

interface HeadlineVariation {
  headline: string;
  style: string;
  best_for: string;
}

interface HiddenStrength {
  strength: string;
  evidence: string;
  why_valuable: string;
  how_to_show_it: string;
}

interface OrderResults {
  order_id: string;
  status: string;
  plan: string;
  input_source?: 'resume' | 'linkedin' | 'questionnaire';
  results: {
    scores: { before: ScoreBreakdown; after: ScoreBreakdown };
    analysis?: {
      ats_intelligence?: {
        top_searched_keywords: string[];
        keywords_present: string[];
        keywords_missing: string[];
        critical_missing: string[];
      };
      weak_verbs_found?: Array<{ verb: string; location: string; suggested_replacement: string }>;
      quantification_breakdown?: { total_bullets: number; quantified_bullets: number; percentage: number; grade: string };
    };
    rewrite: {
      rewritten_headline: string;
      headline_rationale: string;
      rewritten_about: string;
      about_changes: string;
      rewritten_experience: RewrittenExperience[];
      suggested_skills: Array<{ skill: string; reason: string }>;
      placeholders_to_fill: Array<{ location: string; placeholder: string; instruction: string }>;
      personalization_note?: string;
      linkedin_post_hook: string;
      headline_variations?: HeadlineVariation[];
      ats_keywords?: string[];
      jd_analysis?: {
        match_score: number | null;
        matched_keywords: string[];
        missing_keywords: string[];
        gap_summary: string;
        application_recommendation: string;
      };
      cover_letter?: {
        subject_line: string;
        body: string;
        personalization_notes: string;
      };
    };
    card_image_url: string | null;
  };
  referral_code: string;
  referral_url: string;
}

interface PollingResponse {
  status: string;
  progress_pct?: number;
  estimated_seconds?: number;
}

// ─── Helpers ───
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function formatBulletsForCopy(bullets: string[]): string {
  return bullets.map(b => `• ${b}`).join('\n');
}

function formatAboutForCopy(about: string): string {
  // Already has \n\n breaks from Stage 4 output
  return about;
}

function highlightPlaceholders(text: string) {
  if (!text) return text;
  return text.replace(
    /\[X\][%xX+]?/g,
    (match) => `<span style="background:#FEF3C7;color:#92400E;border-radius:3px;padding:1px 4px;font-weight:600">${match}</span>`,
  );
}

const KNOWN_POWER_VERBS = new Set([
  'generated', 'closed', 'negotiated', 'prospected', 'converted', 'exceeded', 'penetrated',
  'captured', 'expanded', 'accelerated', 'drove', 'delivered', 'secured', 'landed', 'grew',
  'spearheaded', 'sourced', 'screened', 'placed', 'headhunted', 'reduced', 'streamlined',
  'implemented', 'built', 'developed', 'transformed', 'optimized', 'led', 'recruited',
  'onboarded', 'retained', 'coached', 'architected', 'engineered', 'deployed', 'shipped',
  'automated', 'scaled', 'integrated', 'launched', 'refactored', 'designed', 'migrated',
  'increased', 'managed', 'created', 'amplified', 'executed', 'produced', 'improved',
  'boosted', 'saved', 'audited', 'forecasted', 'controlled', 'analyzed', 'reported',
  'upsold', 'resolved', 'achieved', 'maintained', 'partnered', 'championed', 'directed',
  'established', 'exceeded', 'pioneered', 'orchestrated', 'revamped', 'consolidated',
]);

function highlightPowerVerbs(html: string): string {
  if (!html || typeof html !== 'string') return html || '';
  // Match bullet lines: "• FirstWord rest..."
  return html.replace(
    /(•\s*)(\w+)/g,
    (match, bullet, firstWord) => {
      if (KNOWN_POWER_VERBS.has(firstWord.toLowerCase())) {
        return `${bullet}<span style="font-weight:800;color:#0A66C2">${firstWord}</span>`;
      }
      return match;
    },
  );
}

function highlightATSKeywords(html: string, keywords: string[]): string {
  if (!html || typeof html !== 'string') return html || '';
  if (!keywords || !keywords.length) return html;
  const highlighted = new Set<string>();
  let result = html;
  for (const kw of keywords) {
    if (highlighted.has(kw.toLowerCase())) continue;
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${escaped})\\b`, 'i');
    result = result.replace(regex, (match) => {
      highlighted.add(kw.toLowerCase());
      return `<span style="text-decoration:underline;text-decoration-color:#0A66C2;text-underline-offset:2px">${match}</span>`;
    });
  }
  return result;
}

// ─── Stage Labels ───
const STAGE_LABELS: Record<string, { label: string; emoji: string }> = {
  queued: { label: 'Getting ready...', emoji: '👋' },
  parsing: { label: 'Reading your profile...', emoji: '👀' },
  analyzing: { label: 'Finding the weak spots...', emoji: '🔬' },
  rewriting: { label: 'Rewriting your profile...', emoji: '✍️' },
  checking: { label: 'Final quality check...', emoji: '✅' },
};
const STAGES = ['queued', 'parsing', 'analyzing', 'rewriting', 'checking'];

// Stage → percentage mapping (always forward)
const STAGE_PCT: Record<string, number> = {
  queued: 5,
  parsing: 20,
  analyzing: 40,
  rewriting: 60,
  checking: 80,
};

// ═══════════════════════════════════════════
// AnimatedNumber
// ═══════════════════════════════════════════
function AnimatedNumber({
  from,
  to,
  duration,
  delay = 0,
  className,
}: {
  from: number;
  to: number;
  duration: number;
  delay?: number;
  className?: string;
}) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        setValue(Math.round(from + (to - from) * progress));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [from, to, duration, delay]);
  return <span className={className}>{value}</span>;
}

// ═══════════════════════════════════════════
// ScoreReveal
// ═══════════════════════════════════════════
function getVerdict(score: number): string {
  if (score <= 30) return 'Your profile is invisible. Recruiters scroll past in under 2 seconds.';
  if (score <= 50) return 'Decent foundation. But nothing here makes a recruiter stop scrolling.';
  if (score <= 70) return 'Solid but forgettable. You are not standing out in a crowded market.';
  if (score <= 85) return 'Strong profile. A few targeted fixes will make it exceptional.';
  return 'Already excellent. Our rewrite refines what is already working.';
}

function ScoreReveal({ before, after }: { before: ScoreBreakdown; after: ScoreBreakdown }) {
  const atsVerdict = (score: number) => {
    if (score >= 86) return { text: 'Optimized', color: '#057642' };
    if (score >= 71) return { text: 'Strong', color: '#44A340' };
    if (score >= 51) return { text: 'Moderate', color: '#B59F3B' };
    if (score >= 31) return { text: 'Weak', color: '#E16B00' };
    return { text: 'Invisible', color: '#CC1016' };
  };

  const subScores = [
    { label: 'Headline', b: before.headline, a: after.headline },
    { label: 'About', b: before.about, a: after.about },
    { label: 'Experience', b: before.experience, a: after.experience },
    { label: 'Completeness', b: before.completeness, a: after.completeness },
  ];

  return (
    <div className="li-card p-6 mb-6">
      {/* Circles */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="flex flex-col items-center">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 90,
              height: 90,
              border: '6px solid var(--li-red)',
            }}
          >
            <AnimatedNumber from={0} to={before.overall} duration={1500} className="text-2xl font-bold" />
          </div>
          <span className="text-xs font-semibold mt-2 uppercase" style={{ color: 'var(--li-red)' }}>
            Before
          </span>
        </div>

        <span className="text-2xl" style={{ color: 'var(--li-text-secondary)' }}>&rarr;</span>

        <div className="flex flex-col items-center">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 110,
              height: 110,
              border: '6px solid var(--li-green)',
            }}
          >
            <AnimatedNumber
              from={before.overall}
              to={after.overall}
              duration={2000}
              delay={1600}
              className="text-3xl font-bold"
            />
          </div>
          <span className="text-xs font-semibold mt-2 uppercase" style={{ color: 'var(--li-green)' }}>
            After
          </span>
        </div>
      </div>

      {/* FIX 12 — Verdict line */}
      <p className="text-sm font-bold text-center mb-6" style={{ color: 'var(--li-text-primary)' }}>
        {getVerdict(before.overall)}
      </p>

      {/* Sub-score bars */}
      <div className="space-y-3">
        {subScores.map((s) => (
          <div key={s.label} className="flex items-center gap-3 text-sm">
            <span className="w-28 text-right" style={{ color: 'var(--li-text-secondary)' }}>
              {s.label}:
            </span>
            <span style={{ color: 'var(--li-text-secondary)' }}>{s.b}</span>
            <span style={{ color: 'var(--li-text-secondary)' }}>&rarr;</span>
            <span style={{ color: 'var(--li-text-primary)' }}>{s.a}</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--li-border)' }}>
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{ width: `${s.a}%`, background: 'var(--li-blue)' }}
              />
            </div>
            <span className="font-bold text-xs" style={{ color: 'var(--li-green)' }}>
              +{s.a - s.b}
            </span>
          </div>
        ))}
      </div>

      {/* VIRAL 3 — Ranking Badge */}
      {(() => {
        const afterScore = after.overall;
        const rankLabel = afterScore >= 80 ? 'Top 10%' : afterScore >= 70 ? 'Top 20%' : afterScore >= 60 ? 'Top 35%' : afterScore >= 50 ? 'Top 50%' : 'Room to improve';
        return (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{
              background: afterScore >= 70 ? '#DCFCE7' : '#FEF3C7',
              border: afterScore >= 70 ? '1px solid #057642' : '1px solid #F59E0B',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: afterScore >= 70 ? '#057642' : '#92400E',
              display: 'inline-block',
              margin: '0 auto',
            }}>
              After rewrite: {rankLabel} of LinkedIn profiles
            </span>
            <p style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 0 }}>
              Most people score below 40. You are now in the {rankLabel}.
            </p>
          </div>
        );
      })()}

      {/* Score gap explanation */}
      <p className="text-xs leading-relaxed mt-4" style={{ color: 'var(--li-text-secondary)' }}>
        Your before score reflects your current profile. Your after score reflects what our
        rewrite achieves when you add your real numbers. The bigger the gap — the more
        opportunity your profile was hiding.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════
// HiddenStrengths
// ═══════════════════════════════════════════
function HiddenStrengths({ strengths }: { strengths: HiddenStrength[] }) {
  if (!strengths?.length) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--li-text-primary)' }}>
        Your Hidden Strengths
      </h2>
      <p className="text-xs mb-3" style={{ color: 'var(--li-text-secondary)' }}>
        What your profile already has — but is not showing clearly enough
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {strengths.map((s, i) => (
          <div
            key={i}
            className="p-4 rounded-lg"
            style={{
              background: '#DCFCE7',
              borderLeft: '4px solid #057642',
              borderRadius: 8,
            }}
          >
            <p className="text-sm font-bold mb-2" style={{ color: 'var(--li-text-primary)' }}>
              {s.strength}
            </p>
            <p className="text-xs italic mb-2" style={{ color: 'var(--li-text-secondary)' }}>
              &ldquo;{s.evidence}&rdquo;
            </p>
            <p className="text-xs mb-1" style={{ color: 'var(--li-text-secondary)' }}>
              <span className="font-semibold">Why it matters:</span> {s.why_valuable}
            </p>
            <p className="text-xs" style={{ color: 'var(--li-blue)' }}>
              <span className="font-semibold">How to show it:</span> {s.how_to_show_it}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// RewriteSection
// ═══════════════════════════════════════════
function RewriteSection({
  title,
  before,
  after,
  copyText,
  atsKeywords,
}: {
  title: string;
  before: string;
  after: string;
  copyText?: string;
  atsKeywords?: string[];
}) {
  const [copied, setCopied] = useState(false);
  const charCount = after?.length || 0;

  // Convert newlines to <br>, highlight placeholders, power verbs, and ATS keywords
  const renderHtml = (text: string) => {
    if (!text || typeof text !== 'string') return text || '';
    let html = text.replace(/\n/g, '<br>');
    html = highlightPlaceholders(html);
    html = highlightPowerVerbs(html);
    if (atsKeywords?.length) html = highlightATSKeywords(html, atsKeywords);
    return html;
  };

  return (
    <div className="li-card mb-4 overflow-hidden">
      <div className="px-4 py-2 text-white text-sm font-semibold" style={{ background: 'var(--li-dark-blue)' }}>
        {title}
      </div>
      <div className="p-4">
        {/* Before */}
        {before && (
          <div
            className="p-3 rounded mb-3 text-sm"
            style={{
              background: '#FEE2E2',
              borderLeft: '3px solid var(--li-red)',
            }}
          >
            <span className="text-xs font-bold block mb-1" style={{ color: 'var(--li-red)' }}>
              ✗ BEFORE
            </span>
            <span className="line-through" style={{ color: 'var(--li-text-secondary)' }}>
              {before}
            </span>
          </div>
        )}

        {/* After */}
        <div
          className="p-3 rounded text-sm"
          style={{
            background: '#DCFCE7',
            borderLeft: '3px solid var(--li-green)',
          }}
        >
          <span className="text-xs font-bold block mb-1" style={{ color: 'var(--li-green)' }}>
            ✓ AFTER
          </span>
          <span
            className="font-semibold"
            style={{ color: 'var(--li-text-primary)' }}
            dangerouslySetInnerHTML={{ __html: renderHtml(after) }}
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs" style={{ color: 'var(--li-text-secondary)' }}>
            {charCount} characters
          </span>
          <button
            onClick={() => {
              copyToClipboard(copyText || after);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full text-white"
            style={{ background: 'var(--li-blue)' }}
          >
            {copied ? '✓ Copied!' : `Copy New ${title}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Pro-only: HeadlineVariants
// ═══════════════════════════════════════════
function HeadlineVariants({ variations }: { variations: HeadlineVariation[] }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
        5 Headline Variations (Pro)
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {variations.map((v, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="text-xs px-3 py-1.5 rounded-full cursor-pointer border-none"
            style={{
              background: active === i ? 'var(--li-blue)' : 'var(--li-gray)',
              color: active === i ? 'white' : 'var(--li-text-secondary)',
            }}
          >
            {v.style}
          </button>
        ))}
      </div>
      <div className="p-3 rounded text-sm font-semibold" style={{ background: 'var(--li-gray)' }}>
        {variations[active]?.headline}
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--li-text-secondary)' }}>
        Best for: {variations[active]?.best_for}
      </p>
      <button
        onClick={() => {
          copyToClipboard(variations[active]?.headline || '');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="mt-2 text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full text-white border-none"
        style={{ background: 'var(--li-blue)' }}
      >
        {copied ? '✓ Copied!' : 'Copy Headline'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// Pro-only: ATS Keywords
// ═══════════════════════════════════════════
function ATSSection({ keywords }: { keywords: string[] }) {
  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
        ATS Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: '#E8F4FD', color: 'var(--li-blue)' }}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ATS Intelligence Card (Phase 1)
// ═══════════════════════════════════════════
function ATSIntelligenceCard({ atsScore, analysis }: {
  atsScore: number;
  analysis: NonNullable<OrderResults['results']['analysis']>;
}) {
  if (!analysis || !analysis.ats_intelligence) return null;
  const atsInt = analysis.ats_intelligence;

  const verdict = (() => {
    if (atsScore >= 86) return { text: 'Optimized', color: '#057642' };
    if (atsScore >= 71) return { text: 'Strong', color: '#44A340' };
    if (atsScore >= 51) return { text: 'Moderate', color: '#B59F3B' };
    if (atsScore >= 31) return { text: 'Weak', color: '#E16B00' };
    return { text: 'Invisible', color: '#CC1016' };
  })();

  return (
    <div className="li-card mb-4 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3" style={{ background: '#004182' }}>
        <span className="text-xs font-bold text-white" style={{ letterSpacing: '2px' }}>
          ATS INTELLIGENCE REPORT
        </span>
      </div>

      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Section A — ATS Score */}
          <div className="flex flex-col items-center justify-center" style={{ minWidth: 100 }}>
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 70, height: 70, border: `4px solid ${verdict.color}` }}
            >
              <span className="text-2xl font-bold" style={{ color: verdict.color }}>{atsScore}</span>
            </div>
            <span className="text-xs font-semibold mt-2" style={{ color: 'var(--li-text-secondary)' }}>ATS Score</span>
            <span className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full text-white" style={{ background: verdict.color }}>
              {verdict.text}
            </span>
          </div>

          {/* Section C — Keywords Missing */}
          <div className="flex-1">
            {Array.isArray(atsInt.critical_missing) && atsInt.critical_missing.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-bold block mb-2" style={{ color: '#CC1016', letterSpacing: '0.5px' }}>
                  Add these keywords to your profile:
                </span>
                <div className="flex flex-wrap gap-2">
                  {atsInt.critical_missing.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ border: '1px solid #CC1016', color: '#CC1016', background: '#FEE2E2' }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(atsInt.keywords_present) && atsInt.keywords_present.length > 0 && (
              <div>
                <span className="text-xs font-bold block mb-2" style={{ color: 'var(--li-text-secondary)', letterSpacing: '0.5px' }}>
                  Keywords in your rewrite:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {atsInt.keywords_present.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: '#E8F4FD', color: 'var(--li-blue)' }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Pro-only: JD Analysis
// ═══════════════════════════════════════════
function JDAnalysis({ analysis }: { analysis: NonNullable<OrderResults['results']['rewrite']['jd_analysis']> }) {
  if (!analysis || analysis.match_score === null) return null;
  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
        Job Description Match (Pro)
      </h3>
      <div className="flex items-center gap-4 mb-3">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 60,
            height: 60,
            border: `4px solid ${analysis.match_score >= 70 ? 'var(--li-green)' : analysis.match_score >= 40 ? 'var(--li-orange)' : 'var(--li-red)'}`,
          }}
        >
          <span className="text-lg font-bold">{analysis.match_score}%</span>
        </div>
        <div>
          <p className="text-sm font-semibold">{analysis.application_recommendation}</p>
          <p className="text-xs" style={{ color: 'var(--li-text-secondary)' }}>{analysis.gap_summary}</p>
        </div>
      </div>
      {Array.isArray(analysis.missing_keywords) && analysis.missing_keywords.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--li-red)' }}>Missing keywords:</p>
          <div className="flex flex-wrap gap-1">
            {analysis.missing_keywords.map((kw, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded" style={{ background: '#FEE2E2', color: 'var(--li-red)' }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Pro-only: Cover Letter
// ═══════════════════════════════════════════
function CoverLetterSection({ coverLetter }: { coverLetter: NonNullable<OrderResults['results']['rewrite']['cover_letter']> }) {
  const [copied, setCopied] = useState(false);

  function download() {
    const blob = new Blob([`Subject: ${coverLetter.subject_line}\n\n${coverLetter.body}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover-letter.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--li-text-primary)' }}>
        Cover Letter (Pro)
      </h3>
      <p className="text-xs mb-3" style={{ color: 'var(--li-text-secondary)' }}>
        Subject: {coverLetter.subject_line}
      </p>
      <div
        className="text-sm p-3 rounded whitespace-pre-wrap mb-3"
        style={{ background: 'var(--li-gray)' }}
        dangerouslySetInnerHTML={{ __html: highlightPlaceholders(coverLetter.body) }}
      />
      <p className="text-xs italic mb-3" style={{ color: 'var(--li-text-secondary)' }}>
        {coverLetter.personalization_notes}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => {
            copyToClipboard(coverLetter.body);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full text-white border-none"
          style={{ background: 'var(--li-blue)' }}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
        <button
          onClick={download}
          className="text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full border-none"
          style={{ background: 'var(--li-gray)', color: 'var(--li-text-primary)' }}
        >
          ⬇ Download .txt
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PlaceholderGuide
// ═══════════════════════════════════════════
function PlaceholderGuide({ placeholders }: { placeholders: Array<{ location: string; placeholder: string; instruction: string }> }) {
  if (!placeholders?.length) return null;
  return (
    <div className="li-card p-4 mb-4">
      <p style={{ fontSize: 13, color: '#057642', fontStyle: 'italic', marginBottom: 8 }}>
        We estimated these metrics based on your industry. Update with your actual numbers for maximum accuracy.
      </p>
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
        Fill In Your Numbers
      </h3>
      <ol className="space-y-2 list-decimal list-inside">
        {placeholders.map((p, i) => (
          <li key={i} className="text-sm">
            <span
              className="font-mono text-xs px-1 rounded"
              style={{ background: '#FEF3C7', color: '#92400E' }}
            >
              {p.placeholder}
            </span>
            <span className="ml-2" style={{ color: 'var(--li-text-secondary)' }}>
              in {p.location} — {p.instruction}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ═══════════════════════════════════════════
// FeedbackWidget
// ═══════════════════════════════════════════
function FeedbackWidget({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit() {
    if (!rating) return;
    try {
      await fetch(`${API_URL}/api/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback: feedback.trim() || undefined }),
      });
      setSaved(true);
    } catch { /* ignore */ }
  }

  if (saved) {
    return (
      <div className="li-card p-4 mb-4 text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--li-green)' }}>
          Thanks for your feedback! {'⭐'.repeat(rating)}
        </p>
      </div>
    );
  }

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--li-text-primary)' }}>
        Rate Your Results
      </h3>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="text-2xl cursor-pointer bg-transparent border-none"
            style={{ opacity: star <= rating ? 1 : 0.3 }}
          >
            ⭐
          </button>
        ))}
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Any thoughts? (optional)"
        rows={2}
        className="w-full px-3 py-2 rounded text-sm outline-none resize-none mb-2"
        style={{ border: '1px solid var(--li-border)' }}
      />
      <button
        onClick={submit}
        disabled={!rating}
        className="text-xs font-semibold cursor-pointer px-4 py-2 rounded-full text-white border-none disabled:opacity-50"
        style={{ background: 'var(--li-blue)' }}
      >
        Submit
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// ReferralWidget
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// ResumeBuilderSection — shows existing resumes or build new
// ═══════════════════════════════════════════
function ResumeBuilderSection({ orderId, maxResumes = 3, plan = 'standard' }: { orderId: string; maxResumes?: number; plan?: string }) {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/resume/by-order/${orderId}`)
      .then(r => r.json())
      .then(d => { setResumes(d.resumes || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [orderId]);

  if (!loaded) return null;

  const quotaFull = resumes.length >= maxResumes;

  async function handleUpgrade() {
    try {
      if (!(window as any).Razorpay) { alert('Payment system is loading. Please try again in a moment.'); return; }
      const res = await fetch(`${API_URL}/api/orders/${orderId}/upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) { const err = await res.json().catch(() => ({})); alert(err.error || 'Could not create upgrade order.'); return; }
      const data = await res.json();
      if (data.razorpay_order_id) {
        const rzp = new (window as any).Razorpay({
          key: data.razorpay_key, amount: data.amount, currency: data.currency,
          order_id: data.razorpay_order_id, name: 'ProfileRoaster',
          description: 'Upgrade to Pro', theme: { color: '#0A66C2' },
          handler: () => { window.location.reload(); },
          modal: { ondismiss: () => { document.body.style.overflow = ''; } },
        });
        rzp.open();
      } else { alert(data.error || 'Upgrade not available.'); }
    } catch { alert('Could not reach server. Please try again.'); }
  }

  return (
    <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border-default)', borderLeft: '4px solid var(--accent)', borderRadius: 12, padding: '20px 24px', marginTop: 24, marginBottom: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', marginBottom: 8 }}>ATS Resume Builder</h3>

      {/* Show existing resumes */}
      {resumes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Your Resumes ({resumes.length}/{maxResumes})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resumes.map((r: any) => (
              <a
                key={r.id}
                href={`/resume/${r.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'white', border: '1px solid var(--border-default)', borderRadius: 8,
                  padding: '10px 16px', textDecoration: 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{r.target_role || 'Resume'}{r.target_company ? ` at ${r.target_company}` : ''}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} &bull; {r.template_id || 'classic'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: r.ats_score >= 80 ? 'var(--success)' : r.ats_score >= 60 ? 'var(--accent)' : 'var(--warning)',
                  }}>
                    ATS: {r.ats_score}%
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--accent)' }}>&rarr;</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* No resumes yet — show build button */}
      {resumes.length === 0 && (
        <>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 12 }}>
            Turn your rewrite into an ATS-optimized resume + cover letter. Paste a job description and get everything in 60 seconds.
          </p>
          <a href={`/resume?orderId=${orderId}`} style={{ display: 'inline-block', background: 'var(--accent)', color: 'white', padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Build My Resume &rarr;
          </a>
        </>
      )}

      {/* Has resumes but quota NOT full — show secondary build link */}
      {resumes.length > 0 && !quotaFull && (
        <a href={`/resume?orderId=${orderId}`} style={{ display: 'inline-block', fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', marginTop: 4 }}>
          + Build another resume ({maxResumes - resumes.length} remaining)
        </a>
      )}

      {/* Quota full — Standard user: show upgrade */}
      {quotaFull && plan === 'standard' && (
        <div style={{ background: 'linear-gradient(135deg, var(--accent-hover), var(--accent))', borderRadius: 10, padding: '16px 20px', marginTop: 4 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 4px' }}>Want more resumes?</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', lineHeight: 1.5 }}>
            5 headline variations, all 11 templates, 3 cover letters, ATS keywords
          </p>
          <button
            onClick={handleUpgrade}
            style={{
              display: 'inline-block', padding: '10px 24px',
              background: 'white', color: 'var(--accent)', borderRadius: 50, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Upgrade to Pro — &#8377;500 &rarr;
          </button>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '6px 0 0' }}>You paid &#8377;499 — only &#8377;500 more</p>
        </div>
      )}

      {/* Quota full — Pro user: friendly message */}
      {quotaFull && plan === 'pro' && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 18px', marginTop: 4 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)', margin: 0 }}>
            You{"'"}re on the Pro plan — all resume slots used. View or edit your resumes above.
          </p>
        </div>
      )}

      <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Included in your {plan === 'pro' ? 'Pro' : 'Standard'} plan</p>
    </div>
  );
}

function ReferralWidget({ code, url, cardUrl }: { code: string; url: string; cardUrl?: string | null }) {
  const [copied, setCopied] = useState(false);
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  async function handleWhatsAppReferral() {
    const text = `I just got my LinkedIn profile rewritten by AI!\n\nScore went way up after the rewrite.\n\nTry it: ${url}`;
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && cardUrl) {
      try {
        const response = await fetch(`${cardUrl}?t=${Date.now()}`);
        const blob = await response.blob();
        const file = new File([blob], 'profile-rewrite.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: 'My Profile Rewrite', text, files: [file] });
          return;
        }
      } catch { /* fall through */ }
    }
    const fallbackText = cardUrl ? `${text}\n\nSee my score card: ${cardUrl}` : text;
    window.open(`https://wa.me/?text=${encodeURIComponent(fallbackText)}`, '_blank');
  }

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--li-text-primary)' }}>
        Share & Earn &#8377;50
      </h3>
      <p className="text-xs mb-3" style={{ color: 'var(--li-text-secondary)' }}>
        Your link: {url}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            copyToClipboard(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full text-white border-none"
          style={{ background: 'var(--li-blue)' }}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-1.5 rounded-full no-underline"
          style={{ background: 'var(--li-gray)', color: 'var(--li-blue)' }}
        >
          Share on LinkedIn
        </a>
        <button
          onClick={handleWhatsAppReferral}
          className="text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full text-white border-none"
          style={{ background: '#25D366' }}
        >
          Share on WhatsApp
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ShareButtons
// ═══════════════════════════════════════════
function ShareButtons({ caption, cardUrl, orderId, beforeScore, afterScore, referralUrl }: {
  caption: string; cardUrl: string | null; orderId: string;
  beforeScore: number; afterScore: number; referralUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [igToast, setIgToast] = useState(false);
  const shareText = caption || 'Just got my LinkedIn profile rewritten by AI!';

  async function downloadCard() {
    if (!cardUrl) return;
    try {
      const response = await fetch(cardUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile-rewrite-${orderId.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(cardUrl, '_blank');
    }
  }

  async function handleWhatsAppShare() {
    const whatsAppText = `My LinkedIn profile just got rewritten by AI! Score: ${beforeScore}\u2192${afterScore}\n\n${shareText}\n\nGet yours: ${referralUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        if (cardUrl) {
          const response = await fetch(cardUrl);
          const blob = await response.blob();
          const file = new File([blob], 'profile-rewrite-card.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'My LinkedIn Profile Transformation',
              text: whatsAppText,
              files: [file],
            });
            return;
          }
        }
      } catch {
        // fall through to wa.me
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsAppText)}`, '_blank');
  }

  async function handleInstagramShare() {
    try {
      if (cardUrl) {
        const response = await fetch(cardUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'linkedin-score-card.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      await navigator.clipboard.writeText(shareText);
      setIgToast(true);
      setTimeout(() => setIgToast(false), 8000);
    } catch {
      setIgToast(true);
      setTimeout(() => setIgToast(false), 5000);
    }
  }

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
        Share Your Results
      </h3>

      {/* Card image */}
      {cardUrl && (
        <div className="mb-4">
          <img src={cardUrl} alt="Score card" className="w-full rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {cardUrl && (
          <button
            onClick={downloadCard}
            className="flex items-center gap-1 text-sm font-semibold cursor-pointer px-4 py-2.5 rounded-full text-white border-none"
            style={{ background: 'var(--li-blue)', minHeight: 40 }}
          >
            ⬇ Download Card
          </button>
        )}

        {/* LinkedIn — PRIMARY */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://profileroaster.in')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-semibold px-4 py-2.5 rounded-lg no-underline"
          style={{ background: '#0A66C2', color: 'white', minHeight: 40 }}
        >
          📤 Share on LinkedIn
        </a>

        {/* WhatsApp — SECONDARY outlined */}
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center gap-1 text-sm font-semibold cursor-pointer px-4 py-2.5 rounded-lg"
          style={{
            border: '2px solid #25D366',
            color: '#25D366',
            background: 'white',
            minHeight: 40,
          }}
        >
          💬 WhatsApp
        </button>

        {/* Instagram — SECONDARY outlined gradient */}
        <button
          onClick={handleInstagramShare}
          className="flex items-center gap-1 text-sm font-semibold cursor-pointer px-4 py-2.5 rounded-lg"
          style={{
            border: '2px solid #E1306C',
            color: '#E1306C',
            background: 'white',
            minHeight: 40,
          }}
        >
          📸 Instagram
        </button>

        <button
          onClick={() => {
            copyToClipboard(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1 text-sm font-semibold cursor-pointer px-4 py-2.5 rounded-lg border-none"
          style={{ background: 'var(--li-gray)', color: 'var(--li-text-primary)', minHeight: 40 }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Caption'}
        </button>
      </div>

      {/* Instagram toast */}
      {igToast && (
        <div className="mt-3 p-3 rounded-lg flex items-center justify-between" style={{ background: '#FEF3C7', border: '1px solid #F59E0B' }}>
          <span className="text-sm" style={{ color: '#92400E' }}>
            📸 Card downloaded + caption copied!
          </span>
          <button
            onClick={() => window.open('https://www.instagram.com', '_blank')}
            className="text-sm font-semibold cursor-pointer bg-transparent border-none"
            style={{ color: '#E1306C' }}
          >
            Open Instagram &rarr;
          </button>
        </div>
      )}

      {!cardUrl && (
        <div className="p-3 rounded text-center" style={{ background: 'var(--li-gray)' }}>
          <p className="text-xs" style={{ color: 'var(--li-text-secondary)' }}>
            Card is being generated... refresh in 30 seconds
          </p>
          <p className="text-xs mt-1 italic" style={{ color: 'var(--li-text-secondary)' }}>
            My LinkedIn score: {shareText} via profileroaster.in
          </p>
        </div>
      )}

      {/* VIRAL 5 — Challenge Button */}
      <p style={{ fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 8, marginTop: 16 }}>
        Dare your friends to beat your score
      </p>
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={async () => {
            const text = `AI analyzed my LinkedIn and improved my score\n\nMy score: ${beforeScore} \u2192 ${afterScore}\n\nThink you can beat this?\nTry: ${referralUrl || 'profileroaster.in'}`;
            if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && cardUrl) {
              try {
                const r = await fetch(`${cardUrl}?t=${Date.now()}`);
                const blob = await r.blob();
                const file = new File([blob], 'linkedin-score.png', { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) { await navigator.share({ title: 'LinkedIn Score Challenge', text, files: [file] }); return; }
              } catch {}
            }
            const fallback = cardUrl ? `${text}\n\nSee my card: ${cardUrl}` : text;
            window.open(`https://wa.me/?text=${encodeURIComponent(fallback)}`, '_blank');
          }}
          style={{
            background: 'white',
            border: '1px solid #25D366',
            color: '#25D366',
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 20px',
            borderRadius: 50,
            cursor: 'pointer',
          }}
        >
          Challenge a Friend on WhatsApp
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// UpsellBanner (Standard only)
// ═══════════════════════════════════════════
function UpsellBanner({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      if (!(window as any).Razorpay) { alert('Payment system is loading. Please try again.'); return; }
      const res = await fetch(`${API_URL}/api/orders/${orderId}/upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) { const err = await res.json().catch(() => ({})); alert(err.error || 'Could not create upgrade order.'); return; }
      const data = await res.json();
      if (data.razorpay_order_id) {
        const rzp = new (window as any).Razorpay({
          key: data.razorpay_key, amount: data.amount, currency: data.currency,
          order_id: data.razorpay_order_id, name: 'ProfileRoaster',
          description: 'Upgrade to Pro', theme: { color: '#0A66C2' },
          handler: () => { window.location.reload(); },
          modal: { ondismiss: () => { document.body.style.overflow = ''; } },
        });
        rzp.open();
      } else { alert(data.error || 'Upgrade not available.'); }
    } catch {
      alert('Could not reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="p-4 mb-4 rounded-lg text-center"
      style={{
        background: 'linear-gradient(135deg, #004182, #0A66C2)',
        borderRadius: 'var(--li-radius)',
      }}
    >
      <p className="text-white text-sm font-bold mb-1">Upgrade to Pro for ₹500</p>
      <p className="text-white/80 text-xs mb-3">
        5 headline variations, all 11 templates, 3 cover letters, ATS keywords
      </p>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="px-6 py-2.5 rounded-full text-sm font-semibold cursor-pointer border-none"
        style={{ background: 'white', color: 'var(--li-blue)' }}
      >
        {loading ? 'Creating...' : 'Upgrade Now →'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// Error States
// ═══════════════════════════════════════════
function ErrorState({ type, onRetry }: { type: string; onRetry?: () => void }) {
  const messages: Record<string, { title: string; desc: string }> = {
    pipeline_failed: {
      title: 'Processing Failed',
      desc: 'We could not process your profile. Full refund issued within 24 hours.',
    },
    payment_failed: {
      title: 'Payment Failed',
      desc: 'Payment did not go through. No charge was made. Try again.',
    },
    modal_closed: {
      title: 'Payment Cancelled',
      desc: 'Looks like you closed payment. Profile saved — complete when ready.',
    },
    api_down: {
      title: 'Cannot load results',
      desc: 'We could not reach the server or the response was unexpected. Check your connection and try again.',
    },
    order_not_found: {
      title: 'Order not found',
      desc: 'This link may be incorrect or the order is not in our system. Use Recover with your purchase email or open the link from your results email.',
    },
    rate_limited: {
      title: 'Too many requests',
      desc: 'Please wait a minute and try again. Keep this page in a single tab while results load.',
    },
    server_error: {
      title: 'Server error',
      desc: 'Something went wrong on our side. Try again in a few minutes.',
    },
    timeout: {
      title: 'Almost There',
      desc: 'Your results are being perfected. We will email your results shortly. You can safely close this page or keep waiting.',
    },
    card_failed: {
      title: 'Card Generation Failed',
      desc: 'Could not generate your card image.',
    },
  };

  const msg = messages[type] || messages.api_down;
  const isSoft = type === 'rate_limited' || type === 'server_error' || type === 'api_down';

  return (
    <div className="li-card p-6 text-center max-w-md">
      <h3 className="text-lg font-bold mb-2" style={{ color: isSoft ? 'var(--text-primary)' : 'var(--li-red)' }}>{msg.title}</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--li-text-secondary)' }}>{msg.desc}</p>
      {type === 'order_not_found' && (
        <a href="/recover" className="inline-block text-sm font-semibold mb-3" style={{ color: 'var(--accent)' }}>Recover my results →</a>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-2.5 rounded-full text-white text-sm font-semibold cursor-pointer border-none"
          style={{ background: 'var(--accent)' }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Results Page
// ═══════════════════════════════════════════
export default function ResultsPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [data, setData] = useState<OrderResults | null>(null);
  const [polling, setPolling] = useState<PollingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentLabel, setCurrentLabel] = useState<{ label: string; emoji: string }>({ label: 'Getting ready...', emoji: '👋' });
  const [stuckSince, setStuckSince] = useState(Date.now());
  const highestProgressRef = useRef(0);
  const pollStartRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks for results view (must be before any early returns)
  const [copiedField, setCopiedField] = useState('');
  const [headlineTab, setHeadlineTab] = useState(0);
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [linkedinUploading, setLinkedinUploading] = useState(false);
  const [linkedinUploadDone, setLinkedinUploadDone] = useState(false);
  const linkedinFileRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<'score' | 'rewrite' | 'resume' | 'prep'>('score');
  const [resumes, setResumes] = useState<any[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [prepLoading, setPrepLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('order_not_found');
          return;
        }
        if (res.status === 429) {
          setError('rate_limited');
          return;
        }
        if (res.status >= 500) {
          setError('server_error');
          return;
        }
        setError('api_down');
        return;
      }
      const json = await res.json();

      if (json.status === 'done') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        highestProgressRef.current = 100;
        setDisplayProgress(100);
        setData(json);
        setPolling(null);
        return;
      }

      if (json.status === 'failed') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setError('pipeline_failed');
        return;
      }

      // Still processing — only move forward
      const newPct = STAGE_PCT[json.status] ?? 5;
      const safePct = Math.max(newPct, highestProgressRef.current);

      if (safePct > highestProgressRef.current) {
        // Progress moved forward — update label and reset stuck timer
        highestProgressRef.current = safePct;
        setDisplayProgress(safePct);
        setStuckSince(Date.now());
        const newLabel = STAGE_LABELS[json.status];
        if (newLabel) setCurrentLabel(newLabel);
      }
      // If safePct === highestProgressRef.current, don't update label or progress
      // (backend retry — user sees nothing)

      setPolling(json);

      // Timeout after 10 minutes (pipeline can take 4-6 min with retries)
      if (Date.now() - pollStartRef.current > 600000) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setError('timeout');
      }
    } catch {
      setError('api_down'); // network / CORS / wrong API URL
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    intervalRef.current = setInterval(fetchOrder, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOrder]);

  // Fetch resumes when results are done
  useEffect(() => {
    if (data?.status === 'done') {
      fetch(`${API_URL}/api/resume/by-order/${orderId}`)
        .then(r => r.json())
        .then(d => { setResumes(d.resumes || []); setResumesLoading(false); })
        .catch(() => setResumesLoading(false));
    }
  }, [data, orderId]);

  // ── Error state ──
  if (error) {
    return (
      <div className="saas-app-canvas min-h-screen flex flex-col">
        <SaasMarketingHeader />
        <main className="flex flex-1 items-center justify-center px-4">
          <ErrorState
            type={error}
            onRetry={
              error && ['api_down', 'rate_limited', 'server_error'].includes(error)
                ? () => { setError(null); fetchOrder(); }
                : undefined
            }
          />
        </main>
      </div>
    );
  }

  // ── Polling / Processing state ──
  if (!data && polling) {
    const isStuck = Date.now() - stuckSince > 10000;

    return (
      <div className="saas-app-canvas min-h-screen flex flex-col">
        <SaasMarketingHeader />
        <main className="flex flex-1 items-center justify-center px-4">
        <div className="li-card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">{currentLabel.emoji}</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--li-text-primary)' }}>
            {currentLabel.label}
          </h2>
          <div className="w-full h-2 rounded-full mb-3" style={{ background: 'var(--li-border)' }}>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${displayProgress}%`,
                background: 'var(--li-blue)',
                transition: 'width 0.8s ease-in-out',
                animation: isStuck ? 'pulse-bar 2s ease-in-out infinite' : 'none',
              }}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--li-text-secondary)' }}>
            {displayProgress}% complete{isStuck ? ' — AI is thinking hard about your profile...' : ''}
          </p>
          <style>{`
            @keyframes pulse-bar {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
          `}</style>
        </div>
        </main>
      </div>
    );
  }

  // ── Loading ──
  if (!data) {
    return (
      <div className="saas-app-canvas min-h-screen flex flex-col">
        <SaasMarketingHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2">⏳</div>
            <p style={{ color: 'var(--li-text-secondary)' }}>Loading results...</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Results ──
  const { results, plan, referral_code, referral_url } = data;
  const { scores, rewrite, analysis } = results;
  const isPro = plan === 'pro';
  const inputSource = (data as any).input_source || 'linkedin';
  const isResumeMode = inputSource === 'resume';
  const isQuestionnaireMode = inputSource === 'questionnaire';

  // Ranking
  const afterScore = scores.after.overall;
  const rankLabel = afterScore >= 80 ? 'Top 10%' : afterScore >= 70 ? 'Top 20%' : afterScore >= 60 ? 'Top 35%' : afterScore >= 50 ? 'Top 50%' : 'Improving';
  const improvement = scores.after.overall - scores.before.overall;

  // Copy handlers
  function handleCopy(text: string, field: string) { copyToClipboard(text); setCopiedField(field); setTimeout(() => setCopiedField(''), 2000); }
  function CopyBtn({ text, field }: { text: string; field: string }) {
    return <button onClick={() => handleCopy(text, field)} style={{ padding: '4px 14px', background: copiedField === field ? '#057642' : '#E8F0FE', color: copiedField === field ? 'white' : '#0A66C2', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{copiedField === field ? 'Copied!' : 'Copy'}</button>;
  }

  // Upgrade handler for sidebar
  async function handleUpgrade() {
    try {
      if (!(window as any).Razorpay) {
        alert('Payment system is loading. Please try again in a moment.');
        return;
      }
      const res = await fetch(`${API_URL}/api/orders/${orderId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Could not create upgrade order. Please try again.');
        return;
      }
      const d = await res.json();
      if (d.razorpay_order_id) {
        const rzp = new (window as any).Razorpay({
          key: d.razorpay_key, amount: d.amount, currency: d.currency,
          order_id: d.razorpay_order_id, name: 'ProfileRoaster', description: 'Upgrade to Pro',
          theme: { color: '#0A66C2' },
          handler: () => { window.location.reload(); },
          modal: { ondismiss: () => { document.body.style.overflow = ''; } },
        });
        rzp.open();
      } else {
        alert(d.error || 'Upgrade not available. You may already be on Pro.');
      }
    } catch (e) {
      alert('Could not reach server. Please check your connection and try again.');
    }
  }

  // Resume CTA handler
  function handleResumeCTA() {
    const maxR = isPro ? 10 : 5;
    fetch(`${API_URL}/api/resume/by-order/${orderId}`).then(r => r.json()).then(d => {
      if ((d.resumes?.length || 0) < maxR) window.location.href = `/resume?orderId=${orderId}`;
      else document.getElementById('resume-section')?.scrollIntoView({ behavior: 'smooth' });
    }).catch(() => { document.getElementById('resume-section')?.scrollIntoView({ behavior: 'smooth' }); });
  }

  // Share handlers
  function handleShareLinkedIn() { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://profileroaster.in')}`, '_blank'); }
  function handleShareWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(`My LinkedIn profile went from ${scores.before.overall} to ${scores.after.overall}! Get yours rewritten: profileroaster.in`)}`, '_blank'); }
  const userName = (data as any).parsed_profile?.name || 'Your Profile';
  const userLocation = (data as any).parsed_profile?.location || '';

  // Helper: score to human-readable label
  function scoreLabel(score: number): string {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Weak';
  }
  // Helper: improvement description
  function improvementLabel(before: number, after: number): string {
    const diff = after - before;
    if (diff > 20) return `${scoreLabel(before)} \u2192 ${scoreLabel(after)}`;
    if (diff > 10) return `${scoreLabel(before)} \u2192 ${scoreLabel(after)}`;
    if (diff > 0) return `${scoreLabel(before)} \u2192 ${scoreLabel(after)}`;
    return scoreLabel(after);
  }
  function improvementColor(before: number, after: number): string {
    const diff = after - before;
    if (diff > 20) return '#A7F3D0';
    if (diff > 10) return '#BBF7D0';
    return 'rgba(255,255,255,0.6)';
  }

  // Data for "What Was Holding Your Profile Back" cards
  const missingKeywords = analysis?.ats_intelligence?.keywords_missing || [];
  const weakVerbs = analysis?.weak_verbs_found || [];
  const quantBreakdown = analysis?.quantification_breakdown;

  return (
    <div className="saas-app-canvas" style={{ minHeight: '100vh' }}>
      <SaasMarketingHeader />
      <div style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface)', padding: '8px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>&larr; Dashboard</a>
          {isPro && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '3px 10px', borderRadius: 12 }}>PRO</span>}
        </div>
      </div>
    <main style={{ fontFamily: "'Inter', system-ui, sans-serif", background: 'var(--bg-canvas)', minHeight: '100vh', paddingBottom: 0 }}>
      <style>{`@keyframes countUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Tab Navigation — Premium */}
      <div className="tab-bar" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {[
            { key: 'score', label: 'Your Score', num: 1 },
            { key: 'rewrite', label: 'LinkedIn Rewrite', num: 2 },
            { key: 'resume', label: 'Resume', num: 3 },
            { key: 'prep', label: 'Interview Prep', num: 4 },
          ].map(tab => (
            <button
              key={tab.key}
              className={`tab-bar-item${activeSection === tab.key ? ' active' : ''}`}
              onClick={() => setActiveSection(tab.key as any)}
            >
              <span className="pill-badge pill-badge-neutral" style={{ marginRight: 6 }}>{tab.num}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ SCORE TAB ═══ */}
      {activeSection === 'score' && (
        <>
          {/* Score Banner */}
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 0' }}>
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid var(--border-default)', overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

              {/* Banner gradient — friendly indigo→violet→pink mesh */}
              <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #18181B 0%, #0A0A0A 100%)',
                padding: '36px 28px 28px', color: 'white',
                overflow: 'hidden',
              }}>
                <div aria-hidden="true" style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(at 25% 0%, rgba(124, 58, 237, 0.32) 0%, transparent 55%), radial-gradient(at 75% 100%, rgba(219, 39, 119, 0.24) 0%, transparent 55%), radial-gradient(at 50% 50%, rgba(79, 70, 229, 0.18) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }} />
                <div aria-hidden="true" style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.04) 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                  pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#C4B5FD', marginBottom: 16, textTransform: 'uppercase' }}>
                    {isResumeMode ? 'Your new resume score' : isQuestionnaireMode ? 'Your new profile score' : 'Your new LinkedIn score'}
                  </div>
                  {/* Score row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 18, animation: 'countUp 0.8s ease-out' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1, color: 'rgba(255, 255, 255, 0.45)' }}>{scores.before.overall}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255, 255, 255, 0.45)', marginTop: 4 }}>Before</div>
                    </div>
                    <div style={{ fontSize: 22, color: 'rgba(255, 255, 255, 0.4)' }}>{'→'}</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em',
                        background: 'linear-gradient(135deg, #A5B4FC 0%, #C4B5FD 50%, #F9A8D4 100%)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        color: 'transparent', WebkitTextFillColor: 'transparent',
                      }}>{scores.after.overall}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C4B5FD', marginTop: 4 }}>Now</div>
                    </div>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.30), rgba(219, 39, 119, 0.25))',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      fontSize: 14, fontWeight: 700, padding: '6px 14px', borderRadius: 999,
                      letterSpacing: '-0.005em',
                    }}>+{improvement} pts</div>
                  </div>
                  {/* Human-readable dimension chips */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {(isResumeMode ? [
                      { label: 'ATS Keywords', b: scores.before.ats || 0, a: scores.after.ats || 0 },
                      { label: 'Action Verbs', b: Math.round((scores.before.experience || 0) * 0.8), a: scores.after.experience || 0 },
                      { label: 'Quantification', b: Math.round((scores.before.completeness || 0) * 0.7), a: scores.after.completeness || 0 },
                    ] : [
                      { label: 'Headline', b: scores.before.headline, a: scores.after.headline },
                      { label: 'About', b: scores.before.about, a: scores.after.about },
                      { label: 'Experience', b: scores.before.experience, a: scores.after.experience },
                      { label: 'ATS', b: scores.before.ats || 0, a: scores.after.ats || 0 },
                    ]).map(s => (
                      <span key={s.label} style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 999, padding: '5px 12px',
                        fontSize: 11, fontWeight: 500, color: 'rgba(255, 255, 255, 0.85)',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}>
                        {s.label} <span style={{ color: improvementColor(s.b, s.a), fontWeight: 700 }}>{improvementLabel(s.b, s.a)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Avatar + name area */}
              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ marginTop: -24, marginBottom: 10 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 800, color: 'white',
                    border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}>
                    {rewrite.rewritten_headline?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{userName}</div>
                {userLocation && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{userLocation}</div>}
                <div style={{ fontSize: 13, fontWeight: 600, color: afterScore >= 70 ? 'var(--success)' : '#92400E' }}>
                  {rankLabel} of {isResumeMode ? 'resumes' : 'LinkedIn profiles'}
                </div>
                {improvement > 0 && (
                  <div style={{ marginTop: 16, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                      &#9989; {isResumeMode
                        ? 'Your ATS resume score improved by ' + improvement + ' points. Build your optimized resume and copy LinkedIn content below.'
                        : isQuestionnaireMode
                        ? 'Your profile score improved by ' + improvement + ' points. Build your resume and LinkedIn content below.'
                        : 'Your profile improved by ' + improvement + ' points. Copy your rewritten sections below.'}
                    </div>
                  </div>
                )}
                {isResumeMode && (
                  <div style={{ marginTop: 12, background: 'var(--accent-subtle)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '16px 18px' }}>
                    <input
                      type="file"
                      accept=".pdf"
                      ref={linkedinFileRef}
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setLinkedinFile(file);
                        setLinkedinUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const res = await fetch(`${API_URL}/api/linkedin-pdf/parse`, { method: 'POST', body: formData });
                          const parsed = await res.json();
                          if (!res.ok) { alert(parsed.error || 'Failed to parse PDF'); return; }
                          const rawText = parsed.raw_paste || parsed.rawText || JSON.stringify(parsed.parsed || '');
                          sessionStorage.setItem('linkedin_parsed', rawText);
                          window.location.href = '/?tab=linkedin&from=results';
                        } catch {
                          alert('Could not parse file. Please try again.');
                        } finally {
                          setLinkedinUploading(false);
                        }
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>
                          Get a LinkedIn-specific analysis
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          Upload your LinkedIn PDF for a detailed profile score and rewrite tailored to LinkedIn.
                        </div>
                      </div>
                      <button
                        onClick={() => linkedinFileRef.current?.click()}
                        disabled={linkedinUploading}
                        style={{ padding: '10px 18px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', opacity: linkedinUploading ? 0.6 : 1 }}
                      >
                        {linkedinUploading ? 'Parsing...' : 'Upload LinkedIn PDF'}
                      </button>
                    </div>
                    {linkedinFile && !linkedinUploading && (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)' }}>
                        &#10003; {linkedinFile.name} parsed — redirecting to start your LinkedIn analysis...
                      </div>
                    )}
                  </div>
                )}
                {isQuestionnaireMode && (
                  <div style={{ marginTop: 12, background: 'var(--accent-subtle)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>
                      Want a more accurate score?
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Upload your resume or LinkedIn PDF for a detailed, personalized analysis.{' '}
                      <a href="/?tab=resume" style={{ color: 'var(--accent)', fontWeight: 600 }}>Upload Resume &rarr;</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* What Was Holding Your Profile Back */}
          {(missingKeywords.length > 0 || weakVerbs.length > 0 || quantBreakdown) && (
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 16px' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>What we fixed</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {isResumeMode ? 'Here’s what was holding your resume back' : isQuestionnaireMode ? 'Here’s how we improved your profile' : 'Here’s what was holding your LinkedIn back'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>

                {/* Card 1: Missing Keywords */}
                {missingKeywords.length > 0 && (
                  <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid var(--border-default)', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>&#128269;</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Missing ATS Keywords</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', background: '#F0FDF4', padding: '2px 8px', borderRadius: 8 }}>&#9989; Fixed</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
                      {missingKeywords.length} keyword{missingKeywords.length !== 1 ? 's' : ''} recruiters search for were absent from your profile.
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {missingKeywords.slice(0, 6).map((k, i) => (
                        <span key={i} style={{ background: '#FEF2F2', color: 'var(--danger)', padding: '2px 8px', borderRadius: 8, fontSize: 11, textDecoration: 'line-through' }}>{k}</span>
                      ))}
                      {missingKeywords.length > 6 && <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 4px' }}>+{missingKeywords.length - 6} more</span>}
                    </div>
                  </div>
                )}

                {/* Card 2: Weak Verbs */}
                {weakVerbs.length > 0 && (
                  <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid var(--border-default)', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>&#9997;&#65039;</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Weak Action Verbs</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', background: '#F0FDF4', padding: '2px 8px', borderRadius: 8 }}>&#9989; Fixed</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
                      {weakVerbs.length} weak verb{weakVerbs.length !== 1 ? 's' : ''} replaced with high-impact power verbs.
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {weakVerbs.slice(0, 5).map((v, i) => (
                        <span key={i} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          <span style={{ textDecoration: 'line-through', color: 'var(--danger)' }}>{v.verb}</span>
                          <span style={{ color: 'var(--text-secondary)', margin: '0 3px' }}>&rarr;</span>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{v.suggested_replacement}</span>
                          {i < Math.min(weakVerbs.length, 5) - 1 && <span style={{ color: '#DDD', margin: '0 4px' }}>|</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card 3: Quantification */}
                {quantBreakdown && (
                  <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid var(--border-default)', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>&#128202;</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Low Quantification</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', background: '#F0FDF4', padding: '2px 8px', borderRadius: 8 }}>&#9989; Fixed</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
                      Only {quantBreakdown.quantified_bullets} of {quantBreakdown.total_bullets} bullets had numbers or metrics.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                        <div style={{ width: `${quantBreakdown.percentage}%`, height: '100%', borderRadius: 3, background: quantBreakdown.percentage < 40 ? 'var(--danger)' : quantBreakdown.percentage < 70 ? 'var(--warning)' : 'var(--success)' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{quantBreakdown.percentage}% — Grade: {quantBreakdown.grade}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Step CTA */}
          <div style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
            <button onClick={() => setActiveSection('rewrite')} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Next: Copy Your LinkedIn Rewrite <span style={{ fontSize: 18 }}>{'\u2192'}</span>
            </button>
          </div>
        </>
      )}

      {/* ═══ REWRITE TAB ═══ */}
      {activeSection === 'rewrite' && (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>

          {/* Resume Builder CTA — primary for resume users */}
          {isResumeMode && (
            <div style={{ background: 'linear-gradient(135deg, #057642, #16A34A)', borderRadius: 12, padding: '24px 28px', color: 'white', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Your Improved Resume is Ready</div>
              <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5, marginBottom: 16 }}>
                AI fixed {missingKeywords.length > 0 ? missingKeywords.length + ' missing keywords, ' : ''}{weakVerbs.length > 0 ? weakVerbs.length + ' weak verbs, ' : ''}and optimized your bullets for ATS scanners. Build your resume now.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleResumeCTA} style={{ padding: '12px 28px', background: 'white', color: '#057642', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Build My Resume
                </button>
              </div>
            </div>
          )}

          {isResumeMode && (
            <div style={{ fontSize: 16, fontWeight: 700, color: '#191919', padding: '8px 0 0', marginBottom: 16 }}>
              LinkedIn Profile Suggestions
              <span style={{ fontSize: 12, fontWeight: 400, color: '#666', marginLeft: 8 }}>Based on your resume</span>
            </div>
          )}

          {/* Blue info banner for resume users */}
          {isResumeMode && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#0A66C2', fontWeight: 600 }}>
              &#128161; LinkedIn content generated from your resume &mdash; copy these to your LinkedIn profile
            </div>
          )}

          {/* Headline card */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#191919' }}>{isResumeMode ? 'LinkedIn Headline' : 'Headline'}</span>
              <CopyBtn text={rewrite.rewritten_headline} field="headline-top" />
            </div>
            <div style={{ background: '#F0F7FF', borderRadius: 10, padding: '14px 18px', fontSize: 16, fontWeight: 600, color: '#191919', lineHeight: 1.5 }}>
              {rewrite.rewritten_headline}
            </div>
            {rewrite.headline_rationale && (
              <p style={{ fontSize: 12, color: '#666', marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>{rewrite.headline_rationale}</p>
            )}

            {/* Headline Variations (Pro only) */}
            {isPro && rewrite.headline_variations && rewrite.headline_variations.length > 1 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E0E0E0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#191919' }}>Variations</span>
                  <CopyBtn text={rewrite.headline_variations[headlineTab]?.headline || ''} field="headline-var" />
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                  {rewrite.headline_variations.map((v, i) => (
                    <button key={i} onClick={() => setHeadlineTab(i)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: headlineTab === i ? '#0B69C7' : '#F3F4F6', color: headlineTab === i ? 'white' : '#666' }}>
                      {i + 1}. {v.style}
                    </button>
                  ))}
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#191919', lineHeight: 1.5 }}>
                  {rewrite.headline_variations[headlineTab]?.headline}
                </div>
                <p style={{ fontSize: 12, color: '#666', marginTop: 6, marginBottom: 0 }}>Best for: {rewrite.headline_variations[headlineTab]?.best_for}</p>
              </div>
            )}
          </div>

          {/* About card */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#191919' }}>{isResumeMode ? 'LinkedIn About' : 'About'}</span>
              <CopyBtn text={rewrite.rewritten_about} field="about" />
            </div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: highlightPlaceholders(highlightATSKeywords(rewrite.rewritten_about, rewrite.ats_keywords || [])) }}
            />
            {isPro && rewrite.ats_keywords && rewrite.ats_keywords.length > 0 && (
              <details style={{ marginTop: 10 }}>
                <summary style={{ fontSize: 12, color: '#0B69C7', fontWeight: 600, cursor: 'pointer' }}>ATS Keywords ({rewrite.ats_keywords.length})</summary>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {rewrite.ats_keywords.map((k, i) => <span key={i} style={{ background: '#E8F0FE', color: '#0B69C7', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{k}</span>)}
                </div>
              </details>
            )}
          </div>

          {/* Experience card */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#191919', display: 'block', marginBottom: 14 }}>{isResumeMode ? 'Improved Experience Bullets' : 'Experience'}</span>
            {rewrite.rewritten_experience?.map((exp, i) => (
              <div key={i} style={{ background: '#F9FAFB', borderRadius: 10, padding: '16px 18px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>{exp.title}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{exp.company}</div>
                  </div>
                  <CopyBtn text={formatBulletsForCopy(exp.bullets)} field={`exp-${i}`} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {exp.bullets.map((b, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#333', lineHeight: 1.7 }}>
                      <span style={{ color: '#0B69C7', fontWeight: 700, flexShrink: 0 }}>&bull;</span>
                      <span dangerouslySetInnerHTML={{ __html: highlightPowerVerbs(highlightPlaceholders(b)) }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Skills card */}
          {rewrite.suggested_skills?.length > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#191919' }}>Skills</span>
                <CopyBtn text={rewrite.suggested_skills.map(s => s.skill).join(', ')} field="skills" />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {rewrite.suggested_skills.map((s, i) => (
                  <span key={i} style={{ background: '#F3F4F6', color: '#191919', padding: '4px 12px', borderRadius: 16, fontSize: 13 }}>{s.skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Copy All button */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              onClick={() => { handleCopy(`HEADLINE:\n${rewrite.rewritten_headline}\n\nABOUT:\n${rewrite.rewritten_about}\n\nEXPERIENCE:\n${rewrite.rewritten_experience?.map(e => `${e.title} at ${e.company}\n${formatBulletsForCopy(e.bullets)}`).join('\n\n') || ''}\n\nSKILLS:\n${rewrite.suggested_skills?.map(s => s.skill).join(', ') || ''}`, 'copy-all'); }}
              style={{ padding: '12px 32px', background: '#0B69C7', color: 'white', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              {copiedField === 'copy-all' ? 'Copied Everything!' : 'Copy All Sections'}
            </button>
          </div>

          {/* Next Step CTA */}
          <div style={{ maxWidth: 800, margin: '24px auto', padding: '0 16px' }}>
            <button onClick={() => setActiveSection('resume')} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #057642, #16A34A)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Next: Download Your Resume <span style={{ fontSize: 18 }}>{'\u2192'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ RESUME TAB ═══ */}
      {activeSection === 'resume' && (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#191919', margin: '0 0 16px' }}>Your ATS Resume</h2>

            {/* Quick download banner */}
            {!resumesLoading && resumes.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1px solid #BBF7D0', borderRadius: 12, padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#057642' }}>Your resume is ready!</div>
                  <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{resumes[0].target_role || 'Professional Resume'} &bull; ATS Score: {resumes[0].ats_score || '--'}%</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`/resume/${resumes[0].id}`} style={{ padding: '10px 20px', background: '#057642', color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Download PDF</a>
                  <a href={`/resume/${resumes[0].id}/edit`} style={{ padding: '10px 20px', background: 'white', color: '#057642', border: '1.5px solid #057642', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Edit</a>
                </div>
              </div>
            )}

            {resumesLoading ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#666' }}>Loading your resume...</div>
            ) : resumes.length > 0 ? (
              <div>
                {resumes.map((r: any, i: number) => (
                  <div key={r.id} style={{ background: '#F9FAFB', borderRadius: 10, padding: '16px 20px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#191919' }}>{r.target_role || `Resume ${i + 1}`}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                        Template: {r.template_id || 'Classic'}
                        {r.ats_score ? <span style={{ color: '#057642', fontWeight: 600, marginLeft: 8 }}>ATS: {r.ats_score}%</span> : null}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={`/resume/${r.id}`} style={{ padding: '8px 16px', background: '#0B69C7', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View & Download</a>
                      <a href={`/resume/${r.id}/edit`} style={{ padding: '8px 16px', background: '#F3F4F6', color: '#191919', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid #D1D5DB' }}>Edit</a>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16 }}>
                  <a href={`/resume?orderId=${orderId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#057642', color: 'white', borderRadius: 50, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                    + Generate Another Resume
                  </a>
                  <span style={{ fontSize: 12, color: '#666', marginLeft: 12 }}>{resumes.length}/{isPro ? 10 : 5} used</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{'\ud83d\udcc4'}</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#191919', marginBottom: 4 }}>Your resume is being generated...</p>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>This usually takes 30-60 seconds after results are ready.</p>
                <a href={`/resume?orderId=${orderId}`} style={{ display: 'inline-block', padding: '10px 24px', background: '#0B69C7', color: 'white', borderRadius: 50, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Build Resume Now
                </a>
              </div>
            )}
          </div>

          {/* Next Step CTA */}
          <div style={{ maxWidth: 800, margin: '24px auto', padding: '0 16px' }}>
            <button onClick={() => setActiveSection('prep')} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Next: Prepare for Interviews <span style={{ fontSize: 18 }}>{'\u2192'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ INTERVIEW PREP TAB ═══ */}
      {activeSection === 'prep' && (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#191919', margin: '0 0 8px' }}>Interview Prep</h2>
            <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px' }}>15 personalized questions + STAR answers tailored to your profile</p>
            {resumes.length > 0 ? (
              <button
                disabled={prepLoading}
                onClick={async () => {
                  setPrepLoading(true);
                  try {
                    const res = await fetch(`${API_URL}/api/interview-prep`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ resume_id: resumes[0].id }),
                    });
                    const data = await res.json();
                    if (!res.ok) { alert(data.error || 'Failed to start interview prep'); return; }
                    const prepId = data.id || data.prep_id || data.prepId;
                    if (prepId) window.location.href = `/interview-prep/${prepId}`;
                    else alert('Could not create interview prep. Please try again.');
                  } catch { alert('Could not reach the server.'); } finally { setPrepLoading(false); }
                }}
                style={{ padding: '12px 28px', background: prepLoading ? '#94A3B8' : '#0B69C7', color: 'white', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {prepLoading ? 'Starting...' : 'Start Interview Prep'}
              </button>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: '#92400E', background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                  A resume is needed first. Your resume is being auto-generated — refresh in a minute.
                </p>
                <a href={`/resume?orderId=${orderId}`} style={{ display: 'inline-block', padding: '10px 24px', background: '#057642', color: 'white', borderRadius: 50, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Build Resume Now
                </a>
              </div>
            )}
            <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>{isPro ? '3 prep sessions per resume' : '1 prep session per resume'} included in your plan</p>
          </div>
        </div>
      )}

      {/* ═══ Footer: Feedback + optional Upgrade (always visible) ═══ */}
      <section style={{ background: 'var(--bg-canvas)', padding: '24px 16px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Feedback widget — gentle ask after seeing results */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid rgba(10, 10, 10, 0.06)',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(10, 10, 10, 0.03)',
          }}>
            <FeedbackWidget orderId={orderId} />
          </div>

          {/* Upgrade to Pro — only if Standard, gentle non-blocking offer */}
          {!isPro && (
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #18181B 0%, #0A0A0A 100%)',
              borderRadius: 16,
              padding: '24px 28px',
              color: 'white',
              overflow: 'hidden',
            }}>
              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.25) 0%, transparent 55%), radial-gradient(at 100% 100%, rgba(219, 39, 119, 0.18) 0%, transparent 55%)',
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 280px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C4B5FD', marginBottom: 6 }}>Want more?</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.015em' }}>Unlock the Pro upgrades</div>
                  <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.55 }}>
                    5 headline variations · all 11 templates · 3 cover letters · advanced ATS keyword matching
                  </div>
                </div>
                <button
                  onClick={handleUpgrade}
                  style={{
                    padding: '12px 22px',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F4F4F5 100%)',
                    color: '#0A0A0A',
                    border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Upgrade — ₹500
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Disclaimer ═══ */}
      <section style={{ background: 'var(--bg-canvas)', padding: '20px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>
            <strong>AI-Generated Content:</strong> Please review all content for accuracy before publishing. Verify company names, job titles, dates, and metrics are factually correct.
          </div>
        </div>
      </section>
    </main>
    </div>
  );
}

