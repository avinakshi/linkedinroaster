'use client';

import { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { TEMPLATES, renderResumeHTML, getRecommendedTemplates } from '../components/resume/ResumeTemplates';
import SiteFooter from '../components/saas/SiteFooter';
import TrustStrip from '../components/landing/TrustStrip';
import BeforeAfter from '../components/landing/BeforeAfter';
import TemplatesShowcase from '../components/landing/TemplatesShowcase';
import { track } from '../lib/analytics';
import '../styles/landing-pr.css';

// Lazy-load below-fold marketing content — cuts initial bundle for faster LCP.
// MarketingStack is ~380 lines of static JSX shown only when user hasn't uploaded yet.
const MarketingStack = lazy(() => import('../components/landing/MarketingStack'));

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ───
interface TeaserResult {
  score: number;
  verdict?: string;
  issues: string[];
  teaser_id: string | null;
  suggested_headline?: string;
  sample_interview_question?: string;
  subscores?: { ats_keywords: number; experience_impact: number; headline_strength: number; overall_readiness: number };
  missing_keywords?: string[];
  sample_improvement?: { before: string; after: string };
  ranking_percentile?: number;
}

// ─── Score Badge ───
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'var(--li-green)' :
    score >= 40 ? 'var(--li-orange)' :
    'var(--li-red)';
  return (
    <div className="flex items-center gap-3">
      <div className="text-4xl font-extrabold" style={{ color }}>{score}</div>
      <div className="text-sm" style={{ color: 'var(--li-text-secondary)' }}>/ 100</div>
    </div>
  );
}

// ─── LiveCounter ───
function LiveCounter() {
  return null;
}

// ─── Referral Code Redeemer ───
function ReferralCodeRedeemer() {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [redeemEmail, setRedeemEmail] = useState('');
  const [profileData, setProfileData] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [refInputMode, setRefInputMode] = useState<'resume' | 'linkedin' | 'paste'>('resume');
  const refFileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    setFileUploading(true);
    setFileName(file.name);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const isLinkedIn = refInputMode === 'linkedin';
      const endpoint = isLinkedIn ? `${API_URL}/api/linkedin-pdf/parse` : `${API_URL}/api/resume/upload-parse`;
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to parse file'); return; }
      setProfileData(data.raw_paste || data.rawText || data.raw_text || JSON.stringify(data.parsed || ''));
    } catch {
      setError('Could not parse file. Try pasting your profile text instead.');
      setRefInputMode('paste');
    } finally {
      setFileUploading(false);
    }
  }

  async function handleRedeem() {
    if (!code.trim() || !redeemEmail.trim()) {
      setError('Please enter your email and referral code.');
      return;
    }
    if (!profileData.trim()) {
      setError('Please upload a file or paste your profile data.');
      return;
    }
    setRedeeming(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/redeem-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          email: redeemEmail.trim(),
          profile_data: profileData.trim() ? { raw_paste: profileData.trim() } : undefined,
          input_source: refInputMode === 'paste' ? 'questionnaire' : refInputMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to redeem code');
        return;
      }
      if (data.order_id) {
        window.location.href = `/results/${data.order_id}`;
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setRedeeming(false);
    }
  }

  if (!showForm) {
    return (
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button
          onClick={() => setShowForm(true)}
          style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          Have a referral code?
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '16px auto 0', padding: '16px 20px', background: '#F8FAFC', border: '1px solid #E0E7F0', borderRadius: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#191919', marginBottom: 10 }}>Redeem Referral Code</div>
      {error && <div style={{ fontSize: 12, color: '#CC1016', marginBottom: 8 }}>{error}</div>}
      <input
        type="email"
        value={redeemEmail}
        onChange={(e) => setRedeemEmail(e.target.value)}
        placeholder="Your email *"
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
      />
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter code (e.g. PR-STD-XXXXX)"
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, marginBottom: 8, fontFamily: 'monospace', boxSizing: 'border-box' }}
      />
      {/* Input mode tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[
          { key: 'resume' as const, label: 'Resume' },
          { key: 'linkedin' as const, label: 'LinkedIn PDF' },
          { key: 'paste' as const, label: 'Paste' },
        ].map(t => (
          <button key={t.key} onClick={() => { setRefInputMode(t.key); setProfileData(''); setFileName(''); }}
            style={{ flex: 1, padding: '6px 8px', fontSize: 11, fontWeight: refInputMode === t.key ? 700 : 500, borderRadius: 6, border: 'none', cursor: 'pointer', background: refInputMode === t.key ? '#E8F0FE' : '#F3F4F6', color: refInputMode === t.key ? 'var(--accent)' : '#666' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* File upload (resume or linkedin) */}
      {(refInputMode === 'resume' || refInputMode === 'linkedin') && (
        <div
          onClick={() => refFileInputRef.current?.click()}
          style={{ border: '2px dashed #94B8DB', borderRadius: 8, padding: '12px 16px', textAlign: 'center', marginBottom: 8, background: profileData ? '#F0FDF4' : '#F0F7FF', cursor: fileUploading ? 'wait' : 'pointer', fontSize: 12 }}
        >
          <input ref={refFileInputRef} type="file" accept={refInputMode === 'resume' ? '.pdf,.docx' : '.pdf'} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} style={{ display: 'none' }} />
          {fileUploading ? (
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Parsing...</span>
          ) : profileData ? (
            <span style={{ color: '#057642', fontWeight: 600 }}>{'\u2705'} {fileName} loaded</span>
          ) : (
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {refInputMode === 'resume' ? '\uD83D\uDCC4 Upload Resume (PDF/DOCX)' : '\uD83D\uDCBC Upload LinkedIn PDF'}
            </span>
          )}
        </div>
      )}

      {/* Paste input */}
      {refInputMode === 'paste' && (
        <textarea
          value={profileData}
          onChange={(e) => setProfileData(e.target.value)}
          placeholder="Paste your headline, experience, or profile text *"
          rows={3}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, marginBottom: 8, resize: 'none', boxSizing: 'border-box' }}
        />
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleRedeem}
          disabled={redeeming}
          style={{
            flex: 1, padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: 'var(--li-blue)', color: 'white', fontSize: 13, fontWeight: 600,
            opacity: redeeming ? 0.6 : 1,
          }}
        >
          {redeeming ? 'Redeeming...' : 'Redeem'}
        </button>
        <button
          onClick={() => setShowForm(false)}
          style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid #E0E0E0', background: 'white', fontSize: 13, cursor: 'pointer', color: '#666' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Profile Input Form (Payment) ───
function ProfileInputForm({
  plan,
  teaserId,
  email: initialEmail,
  initialRawPaste,
  inputSource,
  targetRole,
}: {
  plan: 'standard' | 'pro';
  teaserId: string | null;
  email: string;
  initialRawPaste?: string;
  inputSource: 'resume' | 'linkedin' | 'questionnaire' | 'student';
  targetRole: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [rawPaste, setRawPaste] = useState(initialRawPaste || '');
  const [jobDescription, setJobDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sparseWarning, setSparseWarning] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const sourceLabel = inputSource === 'resume' ? 'Your Resume Data' : inputSource === 'linkedin' ? 'Your LinkedIn Profile (from PDF)' : 'Your Profile Data';

  // Check if questionnaire data is sparse (only headline, no experience/skills)
  const isSparseQuestionnaire = inputSource === 'questionnaire' && rawPaste.trim().length > 0 && (() => {
    const text = rawPaste.trim().toLowerCase();
    const hasExperience = text.includes('experience:') && text.split('experience:')[1]?.trim().length > 20;
    const hasSkills = text.includes('skills:') && text.split('skills:')[1]?.trim().length > 5;
    return !hasExperience && !hasSkills;
  })();

  async function handleSubmit() {
    if (!email.trim() || !rawPaste.trim()) return;
    // Show sparse warning on first click for questionnaire users with minimal data
    if (isSparseQuestionnaire && !sparseWarning) {
      setSparseWarning(true);
      return; // Show warning, don't block — next click proceeds
    }
    track('payment_initiated', { plan, input_source: inputSource });
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          plan,
          profile_data: { raw_paste: rawPaste.trim() },
          job_description: plan === 'pro' ? jobDescription.trim() || undefined : undefined,
          teaser_id: teaserId,
          input_source: inputSource,
          target_role: targetRole || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.errors?.[0] || data.error || 'Failed to create order');
        return;
      }
      if (data.cached) {
        window.location.href = `/results/${data.order_id}`;
        return;
      }
      if (data.razorpay_order_id) {
        openRazorpay(data, email.trim());
      }
    } catch {
      alert('Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  }

  function openRazorpay(orderData: any, userEmail: string) {
    const options = {
      key: orderData.razorpay_key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'ProfileRoaster',
      description: `${plan === 'pro' ? 'Pro' : 'Standard'} Career Transformation`,
      order_id: orderData.razorpay_order_id,
      prefill: { email: userEmail },
      theme: { color: '#4F46E5' },
      handler: function () {
        track('payment_completed', { plan, order_id: orderData.order_id });
        window.location.href = `/results/${orderData.order_id}`;
      },
      modal: {
        ondismiss: function () {
          alert('Payment cancelled. Your profile is saved \u2014 complete payment when ready.');
        },
      },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }

  async function handleRedeem() {
    if (!referralCode.trim() || !email.trim()) return;
    setRedeeming(true);
    try {
      const res = await fetch(`${API_URL}/api/redeem-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: referralCode.trim(),
          email: email.trim(),
          profile_data: { raw_paste: rawPaste.trim() },
          input_source: inputSource,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Invalid code'); return; }
      if (data.order_id) {
        window.location.href = data.redirect_url || `/results/${data.order_id}`;
      }
    } catch { alert('Could not reach the server.'); } finally { setRedeeming(false); }
  }

  return (
    <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 28 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#191919', marginBottom: 4 }}>
        {sourceLabel}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#666' }}>
          {plan === 'pro' ? 'Pro Plan \u2014 \u20b9999' : 'Standard Plan \u2014 \u20b9499'}
        </span>
        {teaserId && <span style={{ fontSize: 12, opacity: 0.6 }}>(teaser linked)</span>}
      </div>
      {initialRawPaste ? (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#057642', fontWeight: 600 }}>
          &#9989; Data auto-filled from your {inputSource === 'resume' ? 'resume' : inputSource === 'linkedin' ? 'LinkedIn PDF' : 'profile'}. Review and edit below if needed.
        </div>
      ) : (
        <p style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>
          Paste your profile data below or go back to upload a file.
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address *"
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
        <textarea
          value={rawPaste}
          onChange={(e) => setRawPaste(e.target.value)}
          placeholder="Your profile data *"
          rows={10}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E0E0E0', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
        />
        {rawPaste.trim().length > 0 && (
          <p style={{ fontSize: 12, color: rawPaste.trim().length > 100 ? '#057642' : '#E16B00' }}>
            {rawPaste.trim().length} characters
            {rawPaste.trim().length < 100 && ' \u2014 add more data for better results'}
          </p>
        )}
        {plan === 'pro' && (
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description you're targeting (optional, Pro feature)"
            rows={3}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E0E0E0', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
          />
        )}
        {sparseWarning && isSparseQuestionnaire && (
          <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>
              Limited data notice
            </div>
            <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>
              You only provided a headline. Your results will be less detailed. You can still proceed, or go back to add more info for better results.
            </div>
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || !email.trim() || !rawPaste.trim()}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: 50, border: 'none',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)', color: 'white',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            opacity: submitting || !email.trim() || !rawPaste.trim() ? 0.5 : 1,
            boxShadow: '0 4px 16px rgba(10,102,194,0.35)',
          }}
        >
          {submitting ? 'Creating order...' : sparseWarning && isSparseQuestionnaire ? `Proceed Anyway \u2014 \u20b9${plan === 'pro' ? '999' : '499'}` : `Pay \u20b9${plan === 'pro' ? '999' : '499'} & Get Full Rewrite`}
        </button>
        {/* Referral code option */}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          {!showReferral ? (
            <button onClick={() => setShowReferral(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
              Have a referral code?
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g., PR-STD-XXXXX)"
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'monospace' }}
              />
              <button
                onClick={handleRedeem}
                disabled={redeeming || !referralCode.trim()}
                style={{ padding: '10px 18px', background: '#057642', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', opacity: redeeming ? 0.6 : 1 }}
              >
                {redeeming ? 'Redeeming...' : 'Redeem'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PDF to Resume Data Mapper (advanced) ───
function truncateSummary(text: string, maxLen = 200): string {
  if (!text || text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen + 50);
  const lastSentence = slice.search(/[.!?]\s/);
  if (lastSentence > 80) return slice.slice(0, lastSentence + 1).trim();
  return text.slice(0, maxLen).trim() + '...';
}

function descriptionToBullets(desc: string): string[] {
  if (!desc) return [];
  let parts = desc.split(/\n|•|·|–|—|\*|^\d+[.)]\s*/m)
    .map(s => s.trim())
    .filter(s => s.length > 15);
  if (parts.length <= 1 && desc.length > 100) {
    parts = desc.split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 15);
  }
  return parts
    .map(b => b.length > 200 ? b.slice(0, 197) + '...' : b)
    .slice(0, 5);
}

function groupSkills(skills: string[]): Array<{ category: string; skills: string[] }> {
  if (!skills || skills.length === 0) return [];
  const techKeywords = /python|java|sql|react|node|aws|azure|docker|kubernetes|html|css|api|git|linux|excel|tableau|power bi|machine learning|ai|data|cloud|devops|networking|security|vmware|sap|salesforce/i;
  const tech = skills.filter(s => techKeywords.test(s));
  const other = skills.filter(s => !techKeywords.test(s));
  const result: Array<{ category: string; skills: string[] }> = [];
  if (tech.length > 0) result.push({ category: 'Technical Skills', skills: tech });
  if (other.length > 0) result.push({ category: 'Professional Skills', skills: other });
  return result.length > 0 ? result : [{ category: 'Skills', skills }];
}

function pdfToResumeData(parsed: any): any {
  if (!parsed) return null;
  const aboutText = parsed.about || parsed.summary || '';
  return {
    contact: {
      name: parsed.full_name || parsed.name || '',
      location: parsed.location || '',
      linkedin: parsed.linkedin || '',
    },
    summary: truncateSummary(aboutText) || parsed.headline || '',
    experience: (parsed.experience || []).slice(0, 6).map((e: any) => ({
      title: e.title || e.role || '',
      company: e.company || '',
      dates: e.duration || e.dates || (e.start_date ? `${e.start_date} - ${e.end_date || 'Present'}` : ''),
      bullets: descriptionToBullets(e.description || (e.bullets || []).join('\n') || ''),
    })),
    education: (parsed.education || []).map((e: any) => ({
      institution: e.institution || '',
      degree: e.degree || '',
      field: e.field || '',
      year: e.year || '',
    })),
    skills: groupSkills(parsed.skills || []),
    achievements: [
      ...(parsed.honors_awards || []),
      ...(parsed.certifications || []).slice(0, 3).map((c: string) => `Certified: ${c}`),
    ].slice(0, 5),
  };
}


// ════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════
// ─── Student Pay Button ───
function StudentPayButton({ formData, email }: { formData: any; email: string }) {
  const [paying, setPaying] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  async function handlePay() {
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/api/build/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: 'student', form_input: formData }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to create order'); return; }

      const rzp = new (window as any).Razorpay({
        key: data.razorpay_key,
        amount: data.amount,
        currency: data.currency,
        name: 'ProfileRoaster',
        description: 'Student Plan — Resume + LinkedIn + Interview Prep',
        order_id: data.razorpay_order_id,
        prefill: { email },
        handler: () => { window.location.href = `/build/results/${data.order_id}`; },
        theme: { color: '#057642' },
      });
      rzp.open();
    } catch {
      alert('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  async function handleRedeem() {
    if (!referralCode.trim() || !email.trim()) return;
    setRedeeming(true);
    try {
      const res = await fetch(`${API_URL}/api/redeem-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: referralCode.trim(),
          email: email.trim(),
          form_input: formData,
          input_source: 'student',
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Invalid code'); return; }
      if (data.order_id) {
        window.location.href = data.redirect_url || `/build/results/${data.order_id}`;
      }
    } catch { alert('Could not reach the server.'); } finally { setRedeeming(false); }
  }

  return (
    <div>
      <button onClick={handlePay} disabled={paying} style={{ width: '100%', padding: '14px', background: 'white', color: '#057642', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: paying ? 0.6 : 1 }}>
        {paying ? 'Processing...' : 'Pay \u20b9199 & Build My Resume'}
      </button>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        {!showReferral ? (
          <button onClick={() => setShowReferral(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 13, cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }}>
            Have a referral code?
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              style={{ flex: 1, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', background: 'rgba(255,255,255,0.15)', color: 'white' }}
            />
            <button
              onClick={handleRedeem}
              disabled={redeeming || !referralCode.trim()}
              style={{ padding: '10px 16px', background: 'white', color: '#057642', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: redeeming ? 0.6 : 1 }}
            >
              {redeeming ? '...' : 'Redeem'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  // Input source tracking
  const [inputSource, setInputSource] = useState<'resume' | 'linkedin' | 'questionnaire' | 'student'>('resume');
  const [activeInputTab, setActiveInputTab] = useState<'resume' | 'linkedin' | 'questionnaire' | 'student'>('resume');

  // Core state
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [teaser, setTeaser] = useState<TeaserResult | null>(null);
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  // Template gallery
  const [galleryFilter, setGalleryFilter] = useState('All');

  // Resume upload state
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeParsed, setResumeParsed] = useState<any>(null);
  const [resumeError, setResumeError] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeRawText, setResumeRawText] = useState('');
  const [resumeDragOver, setResumeDragOver] = useState(false);

  // LinkedIn PDF upload state
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfParsed, setPdfParsed] = useState<any>(null);
  const [pdfError, setPdfError] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfRawPaste, setPdfRawPaste] = useState('');
  const [pdfDragOver, setPdfDragOver] = useState(false);

  // Confirmation screen
  const [showConfirmScreen, setShowConfirmScreen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmHeadline, setConfirmHeadline] = useState('');
  const [confirmExperience, setConfirmExperience] = useState('');
  const [confirmEducation, setConfirmEducation] = useState('');
  const [confirmSkills, setConfirmSkills] = useState('');
  const [targetRole, setTargetRole] = useState('');

  // Questionnaire state
  const [qName, setQName] = useState('');
  const [qHeadline, setQHeadline] = useState('');
  const [qExperience, setQExperience] = useState('');
  const [qEducation, setQEducation] = useState('');
  const [qSkills, setQSkills] = useState('');
  const [qTargetRole, setQTargetRole] = useState('');

  // Student form
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentCollege, setStudentCollege] = useState('');
  const [studentDegree, setStudentDegree] = useState('');
  const [studentBranch, setStudentBranch] = useState('');
  const [studentGradYear, setStudentGradYear] = useState('2025');
  const [studentLocation, setStudentLocation] = useState('');
  const [studentTargetRole, setStudentTargetRole] = useState('');
  const [studentInternships, setStudentInternships] = useState('');
  const [studentProjects, setStudentProjects] = useState('');
  const [studentSkills, setStudentSkills] = useState('');
  const [studentAchievements, setStudentAchievements] = useState('');
  const [studentCertifications, setStudentCertifications] = useState('');
  const [studentStep, setStudentStep] = useState(1);
  const [studentFormData, setStudentFormData] = useState<any>(null);

  // Teaser referral code
  const [showTeaserReferral, setShowTeaserReferral] = useState(false);
  const [teaserReferralCode, setTeaserReferralCode] = useState('');
  const [teaserReferralEmail, setTeaserReferralEmail] = useState('');
  const [teaserReferralRedeeming, setTeaserReferralRedeeming] = useState(false);

  // FAQ & misc
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pricingRef = useRef<HTMLDivElement>(null);
  const inputFormRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Scroll to result
  useEffect(() => {
    if (teaser && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [teaser]);

  // Pre-fill teaser referral email from main email state
  useEffect(() => {
    if (email && !teaserReferralEmail) setTeaserReferralEmail(email);
  }, [email]);

  // Handle ?plan= and ?tab= query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam === 'standard' || planParam === 'pro') {
      setTimeout(() => heroRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
    const tabParam = params.get('tab');
    if (tabParam === 'student') {
      setActiveInputTab('student');
      setInputSource('student');
    } else if (tabParam === 'questionnaire') {
      setActiveInputTab('questionnaire');
      setInputSource('questionnaire');
    } else if (tabParam === 'linkedin') {
      setActiveInputTab('linkedin');
      setInputSource('linkedin');
    }
  }, []);

  // ── Core teaser runner ──
  async function runTeaser(headlineText: string) {
    const today = new Date().toISOString().split('T')[0];
    const lsKey = `teaser_count_${today}`;
    const count = parseInt(localStorage.getItem(lsKey) || '0', 10);
    if (count >= 5) { setRateLimited(true); return; }

    track('teaser_started', { input_source: inputSource, target_role: targetRole || qTargetRole || undefined });

    setLoading(true);
    setLoadingStage('Parsing your profile...');
    setLoadingProgress(20);
    const stageTimer = setTimeout(() => { setLoadingStage('Analyzing headline & keywords...'); setLoadingProgress(50); }, 2000);
    const stageTimer2 = setTimeout(() => { setLoadingStage('Generating your score...'); setLoadingProgress(80); }, 4000);
    try {
      const res = await fetch(`${API_URL}/api/teaser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: headlineText.slice(0, 500),
          input_source: inputSource,
          target_role: targetRole || qTargetRole || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeaser(data);
        localStorage.setItem(lsKey, String(count + 1));
        track('teaser_completed', { score: data.score, input_source: inputSource });
      } else if (res.status === 429) {
        setRateLimited(true);
        track('teaser_failed', { reason: 'rate_limited' });
      } else {
        alert(data.errors?.[0] || data.error || 'Something went wrong');
        track('teaser_failed', { reason: 'api_error', status: res.status });
      }
    } catch {
      alert('Could not reach the server. Please try again.');
      track('teaser_failed', { reason: 'network' });
    } finally {
      clearTimeout(stageTimer);
      clearTimeout(stageTimer2);
      setLoadingProgress(0);
      setLoadingStage('');
      setLoading(false);
    }
  }

  // ── Resume upload ──
  async function uploadAndParseResume(file: File) {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setResumeError('Please upload a PDF or DOCX file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError('File too large. Maximum 10MB.');
      return;
    }

    setResumeUploading(true);
    setResumeError('');
    setResumeFileName(file.name);
    setResumeParsed(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/resume/upload-parse`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setResumeError(data.error || 'Failed to parse resume. Try a different file.');
        return;
      }

      setResumeParsed(data.parsed || data);
      setResumeRawText(data.rawText || data.raw_text || data.raw_paste || JSON.stringify(data.parsed || data));
      setInputSource('resume');

      // Populate confirmation screen — handle field name differences between endpoints
      const p = data.parsed || data;
      setConfirmName(p.full_name || p.name || '');
      setConfirmHeadline(p.headline || p.summary || p.title || '');
      setConfirmExperience(
        (p.experience || []).map((e: any) => {
          const title = e.title || e.role || '';
          const company = e.company || '';
          const dates = e.duration || e.dates || (e.start_date ? `${e.start_date} - ${e.end_date || 'Present'}` : '');
          return `${title} at ${company}${dates ? ` (${dates})` : ''}`;
        }).join('\n') || ''
      );
      setConfirmEducation(
        (p.education || []).map((e: any) => `${e.degree || ''} ${e.field || ''} - ${e.institution || ''}`).join('\n') || ''
      );
      setConfirmSkills((p.skills || []).join(', '));

      // Auto-set targetRole from parsed data if not already filled
      if (!targetRole.trim()) {
        const inferredRole = p.target_role || p.current_role?.title || (p.headline ? p.headline.split('|')[0]?.trim() : '');
        if (inferredRole) setTargetRole(inferredRole);
      }

      // Auto-run teaser immediately (skip confirmation screen)
      const h = p.headline || p.summary?.slice(0, 100) || confirmHeadline;
      if (h && h.length >= 10) {
        setHeadline(h);
        runTeaser(h);
      } else {
        // Not enough data — show confirmation so user can fill headline
        setShowConfirmScreen(true);
      }
    } catch (err: any) {
      // Resume upload error — user sees error message below
      setResumeError('Could not reach the server. Please check your internet connection.');
    } finally {
      setResumeUploading(false);
    }
  }

  // ── LinkedIn PDF upload ──
  async function uploadAndParsePdf(file: File) {
    if (file.type !== 'application/pdf') {
      setPdfError('Please upload a PDF file. On LinkedIn, click "More" \u2192 "Save to PDF".');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfError('File too large. Maximum 10MB.');
      return;
    }

    setPdfUploading(true);
    setPdfError('');
    setPdfFileName(file.name);
    setPdfParsed(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/linkedin-pdf/parse`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setPdfError(data.error || 'Failed to parse PDF. Try a different file.');
        return;
      }

      setPdfParsed(data.parsed);
      setPdfRawPaste(data.raw_paste || '');
      setInputSource('linkedin');

      // Populate confirmation screen
      const p = data.parsed || {};
      setConfirmName(p.full_name || p.name || '');
      setConfirmHeadline(p.headline || p.summary || '');
      setConfirmExperience(
        (p.experience || []).map((e: any) => {
          const title = e.title || e.role || '';
          const company = e.company || '';
          const dates = e.duration || (e.start_date ? `${e.start_date} - ${e.end_date || 'Present'}` : '');
          return `${title} at ${company}${dates ? ` (${dates})` : ''}`;
        }).join('\n') || ''
      );
      setConfirmEducation(
        (p.education || []).map((e: any) => `${e.degree || ''} ${e.field || ''} - ${e.institution || ''}`).join('\n') || ''
      );
      setConfirmSkills((p.skills || []).join(', '));

      // Auto-set targetRole from parsed data if not already filled
      if (!targetRole.trim()) {
        const inferredRole = p.target_role || p.current_role?.title || (p.headline ? p.headline.split('|')[0]?.trim() : '');
        if (inferredRole) setTargetRole(inferredRole);
      }

      // Auto-run teaser immediately (skip confirmation screen)
      const h = p.headline || p.summary?.slice(0, 100) || confirmHeadline;
      if (h && h.length >= 10) {
        setHeadline(h);
        runTeaser(h);
      } else {
        // Not enough data — show confirmation so user can fill headline
        setShowConfirmScreen(true);
      }
    } catch (err: any) {
      // PDF upload error — user sees error message below
      setPdfError('Could not reach the server. Please check your internet connection.');
    } finally {
      setPdfUploading(false);
    }
  }

  // ── Confirm & run teaser ──
  function handleConfirmAndScore() {
    const h = confirmHeadline.trim();
    if (!h || h.length < 10) {
      alert('Please add a headline with at least 10 characters.');
      return;
    }
    setHeadline(h);

    // Build raw paste from confirmed data
    const sections = [
      confirmName.trim() && `Name: ${confirmName.trim()}`,
      `Headline: ${h}`,
      confirmExperience.trim() && `Experience:\n${confirmExperience.trim()}`,
      confirmEducation.trim() && `Education:\n${confirmEducation.trim()}`,
      confirmSkills.trim() && `Skills: ${confirmSkills.trim()}`,
      targetRole.trim() && `Target Role: ${targetRole.trim()}`,
    ].filter(Boolean).join('\n\n');

    if (inputSource === 'resume') {
      setResumeRawText(sections);
    } else {
      setPdfRawPaste(sections);
    }

    setShowConfirmScreen(false);
    runTeaser(h);
  }

  // ── Questionnaire submit ──
  function handleQuestionnaireSubmit() {
    const h = qHeadline.trim();
    if (!h || h.length < 10) {
      alert('Please enter your current headline or job title (at least 10 characters).');
      return;
    }
    setInputSource('questionnaire');
    setHeadline(h);
    setTargetRole(qTargetRole);

    const sections = [
      qName.trim() && `Name: ${qName.trim()}`,
      `Headline: ${h}`,
      qExperience.trim() && `Experience:\n${qExperience.trim()}`,
      qEducation.trim() && `Education:\n${qEducation.trim()}`,
      qSkills.trim() && `Skills: ${qSkills.trim()}`,
      qTargetRole.trim() && `Target Role: ${qTargetRole.trim()}`,
    ].filter(Boolean).join('\n\n');

    setPdfRawPaste(sections);
    runTeaser(h); // Show teaser score for No File users too
  }

  // ── Email submit ──
  async function handleEmailSubmit() {
    if (!email.trim() || !teaser?.teaser_id) return;
    try {
      await fetch(`${API_URL}/api/teaser/${teaser.teaser_id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setEmailSaved(true);
    } catch { /* ignore */ }
    scrollToPricing();
  }

  function scrollToPricing() {
    setShowPricing(true);
    setTimeout(() => pricingRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function handlePlanSelect(plan: 'standard' | 'pro') {
    track('plan_selected', { plan, has_teaser: !!teaser });
    setSelectedPlan(plan);
    setShowPricing(true);
    setTimeout(() => inputFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function resetUpload() {
    setResumeParsed(null); setResumeFileName(''); setResumeRawText(''); setResumeError('');
    setPdfParsed(null); setPdfFileName(''); setPdfRawPaste(''); setPdfError('');
    setShowConfirmScreen(false); setTeaser(null); setHeadline('');
    setConfirmName(''); setConfirmHeadline(''); setConfirmExperience(''); setConfirmEducation(''); setConfirmSkills(''); setTargetRole('');
  }

  // Get current raw paste based on input source
  const currentRawPaste = inputSource === 'resume' ? resumeRawText : inputSource === 'linkedin' ? pdfRawPaste : pdfRawPaste;
  const currentParsed = inputSource === 'resume' ? resumeParsed : pdfParsed;

  // ── Tab style helper ──
  function tabStyle(tab: 'resume' | 'linkedin' | 'questionnaire') {
    const isActive = activeInputTab === tab;
    return {
      flex: '1 1 0',
      padding: '10px 8px',
      fontSize: 13,
      fontWeight: isActive ? 700 : 500,
      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
      background: isActive ? 'var(--accent-subtle)' : 'transparent',
      border: 'none',
      borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
      cursor: 'pointer',
      transition: 'all 150ms ease',
      textAlign: 'center' as const,
      whiteSpace: 'nowrap' as const,
    };
  }

  // ── Pricing section ──
  const pricingSection = (
    <section id="pricing" ref={pricingRef} style={{ padding: '56px 24px', background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-default)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>Simple Pricing</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>For working professionals — full profile rewrite + resume + interview prep.</p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 36 }}>Profile score is free. Pay only when you{"'"}re ready.</p>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
          {/* Standard */}
          <div className="saas-card" style={{ flex: '1 1 340px', maxWidth: 420, border: '2px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '32px 28px', position: 'relative', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap' }}>
              Most Popular
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 8, marginTop: 8 }}>Standard</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>
              &#8377;499 <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>one-time</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Pay once. Download forever.</div>
            <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 28, padding: 0 }}>
              {[
                { text: 'AI Profile Score + Analysis', free: true },
                { text: 'Complete Profile Rewrite', free: false },
                { text: 'ATS Resume Builder', free: false },
                { text: 'Cover Letter Generator', free: false },
                { text: 'Interview Prep + Quiz', free: false },
                { text: 'AI Enhance Editor', free: false },
                { text: 'PDF + TXT Export', free: false },
              ].map((f, i) => (
                <li key={i} style={{ fontSize: 14, color: '#333', padding: '8px 0', borderBottom: '1px solid var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>&#10003;</span>
                  {f.text}
                  {f.free && <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--success-subtle)', color: 'var(--success)', padding: '1px 6px', borderRadius: 3, marginLeft: 4 }}>FREE</span>}
                </li>
              ))}
            </ul>
            <button
              className="saas-btn saas-btn-primary"
              onClick={() => { if (teaser || rateLimited || currentRawPaste) { handlePlanSelect('standard'); } else { heroRef.current?.scrollIntoView({ behavior: 'smooth' }); } }}
              style={{ width: '100%', padding: '16px 32px', borderRadius: 'var(--radius-pill)', fontSize: 16, fontWeight: 700, boxShadow: 'var(--shadow-md)' }}
            >
              {teaser ? 'Get Everything for \u20b9499 \u2192' : 'Get Started \u2014 \u20b9499 \u2192'}
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>Secure payment via Razorpay (UPI / Card / Net Banking)</div>
            {inputSource === 'questionnaire' && !qExperience.trim() && (
              <div style={{ fontSize: 11, color: '#92400E', marginTop: 6 }}>
                Tip: Add experience details above for better results
              </div>
            )}
          </div>

          {/* Pro */}
          <div className="saas-card" style={{ flex: '1 1 340px', maxWidth: 420, borderRadius: 'var(--radius-lg)', padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 8, marginTop: 8 }}>Pro</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>
              &#8377;999 <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>one-time</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Everything in Standard, plus more.</div>
            <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 28, padding: 0 }}>
              {[
                'Everything in Standard',
                'All premium resume templates',
                'Priority AI processing',
                'Job-description-tailored rewrite',
                'Targeted cover letter',
                'Advanced interview coaching',
              ].map((f, i) => (
                <li key={i} style={{ fontSize: 14, color: '#333', padding: '8px 0', borderBottom: '1px solid var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="saas-btn saas-btn-ghost"
              onClick={() => { if (teaser || rateLimited || currentRawPaste) { handlePlanSelect('pro'); } else { heroRef.current?.scrollIntoView({ behavior: 'smooth' }); } }}
              style={{ width: '100%', padding: '16px 32px', borderRadius: 'var(--radius-pill)', fontSize: 16, fontWeight: 700, border: '2px solid var(--accent)', color: 'var(--accent)' }}
            >
              Get Pro &#8594;
            </button>
          </div>
        </div>

        <ReferralCodeRedeemer />

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 16, fontSize: 12, color: '#6B7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{'\uD83D\uDD12'} Secure payment via Razorpay</span>
          <span>&bull;</span>
          <span>Built for TCS, Infosys, Wipro, Amazon applicants</span>
          <span>&bull;</span>
          <span>Results in 90 seconds</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, padding: '10px 16px', background: 'var(--success-subtle)', borderRadius: 'var(--radius-sm)' }}>
          <span>&#128274;</span>
          <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Your data is encrypted, never shared, and you can delete it anytime</span>
        </div>
      </div>
    </section>
  );

  return (
    <main className="pr-landing" style={{ minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      {/* ═══ NAV ═══ */}
      <nav className="pr-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="pr-nav__inner">
          {/* Wordmark with gradient icon mark */}
          <a href="/" className="pr-nav__logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span aria-hidden="true" style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
              ProfileRoaster
            </span>
          </a>

          {/* Center nav — desktop */}
          <div className="hidden sm:flex pr-nav__links" style={{ gap: 28 }}>
            <a href="/templates" className="pr-nav__link">Templates</a>
            <a href="#pricing" className="pr-nav__link">Pricing</a>
            <a href="#how-it-works" className="pr-nav__link">How it works</a>
            <a href="#faq" className="pr-nav__link">FAQ</a>
          </div>

          {/* Right side — Sign in + CTA */}
          <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 16 }}>
            <a href="/dashboard" style={{
              fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
              textDecoration: 'none', transition: 'color 0.15s',
            }}>Sign in</a>
            <button
              type="button"
              onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                fontSize: 14, fontWeight: 600, color: 'white',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.2)'; }}
            >
              Get free score
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="sm:hidden pr-nav__menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden pr-mobile-panel">
            <a href="/templates" onClick={() => setMobileMenuOpen(false)}>Templates</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Sign in</a>
            <button type="button" onClick={() => { setMobileMenuOpen(false); heroRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>Get free score</button>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════ */}
      {/* HERO — Two Columns                  */}
      {/* ═══════════════════════════════════ */}
      <section ref={heroRef} className="pr-hero">
        <div className="pr-hero__grid">

            {/* LEFT — Value Proposition */}
            <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {/* Live status pill */}
              <div className="pr-eyebrow" style={{ alignSelf: 'flex-start' }}>
                <span style={{ color: 'var(--accent-deep)' }}>1,247 profiles rewritten today</span>
              </div>

              <h1 className="pr-hero__title" style={{ maxWidth: 620 }}>
                Stop getting ghosted.<br />
                <span className="pr-hero__title-accent">Upgrade your profile</span> in 90 seconds.
              </h1>

              <p style={{ fontSize: 'clamp(16px, 2.4vw, 19px)', lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 0 8px' }}>
                Upload your resume or LinkedIn PDF. AI scores it, rewrites every line, builds your ATS resume, and preps you for interviews — for less than a coffee at Starbucks.
              </p>

              {/* CTA row */}
              <div style={{ display: 'flex', gap: 14, marginTop: 'clamp(28px, 5vw, 40px)', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (activeInputTab !== 'resume') { setActiveInputTab('resume'); setInputSource('resume'); }
                    const el = document.querySelector('.pr-upload-shell');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    requestAnimationFrame(() => resumeInputRef.current?.click());
                  }}
                  style={{
                    height: 60, padding: '0 32px',
                    background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 50%, #6366F1 100%)',
                    borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 10px 24px -6px rgba(79, 70, 229, 0.45), 0 4px 8px rgba(79, 70, 229, 0.18)',
                    transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s',
                    letterSpacing: '-0.01em',
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 16px 36px -8px rgba(79, 70, 229, 0.55), 0 6px 12px rgba(79, 70, 229, 0.22)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 10px 24px -6px rgba(79, 70, 229, 0.45), 0 4px 8px rgba(79, 70, 229, 0.18)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  Upload Resume — Free Score
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveInputTab('linkedin'); setInputSource('linkedin');
                    const el = document.querySelector('.pr-upload-shell');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    requestAnimationFrame(() => pdfInputRef.current?.click());
                  }}
                  style={{
                    height: 60, padding: '0 22px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    borderRadius: 14, color: 'var(--text-primary)', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'; e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  LinkedIn PDF
                </button>
              </div>

              {/* Micro trust line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  Encrypted
                </div>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)' }} />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No signup</div>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)' }} />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Free score in 90s</div>
              </div>

              {/* Modern stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginTop: 40, maxWidth: 520 }}>
                {[
                  { value: '2,400+', label: 'Resumes analyzed', accent: false },
                  { value: '+45', label: 'Avg score lift', suffix: 'pts', accent: true },
                  { value: '90s', label: 'Median delivery', accent: false },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'rgba(255, 255, 255, 0.55)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: 14,
                    padding: '14px 16px',
                  }}>
                    <div style={{
                      fontSize: 'clamp(22px, 3vw, 28px)',
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                      color: s.accent ? 'transparent' : 'var(--text-primary)',
                      backgroundImage: s.accent ? 'var(--gradient-text)' : 'none',
                      WebkitBackgroundClip: s.accent ? 'text' : 'unset',
                      backgroundClip: s.accent ? 'text' : 'unset',
                      lineHeight: 1.1,
                    }}>
                      {s.value}
                      {s.suffix && <span style={{ fontSize: '0.55em', fontWeight: 600, marginLeft: 3, color: 'var(--text-muted)', background: 'none', WebkitTextFillColor: 'var(--text-muted)' }}>{s.suffix}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT (45%) — Upload Card with Tabs */}
            <div data-upload-area style={{ flex: '1 1 380px', minWidth: 0, maxWidth: 500 }}>
              <div className="pr-upload-shell">

                {/* Tab navigation — clean pills */}
                <div className="pr-tab-rail">
                  <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: 'var(--bg-canvas)', borderRadius: 10, width: '100%' }}>
                    {/* Student tab hidden — accessible via /?tab=student */}
                    <button onClick={() => { setActiveInputTab('resume'); setInputSource('resume'); }}
                      style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: activeInputTab === 'resume' ? 700 : 500, borderRadius: 8, border: 'none', cursor: 'pointer', background: activeInputTab === 'resume' ? 'var(--bg-surface)' : 'transparent', color: activeInputTab === 'resume' ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: activeInputTab === 'resume' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                      Resume
                    </button>
                    <button onClick={() => { setActiveInputTab('linkedin'); setInputSource('linkedin'); }}
                      style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: activeInputTab === 'linkedin' ? 700 : 500, borderRadius: 8, border: 'none', cursor: 'pointer', background: activeInputTab === 'linkedin' ? 'var(--bg-surface)' : 'transparent', color: activeInputTab === 'linkedin' ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: activeInputTab === 'linkedin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                      LinkedIn
                    </button>
                    <button onClick={() => { setActiveInputTab('questionnaire'); setInputSource('questionnaire'); }}
                      style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: activeInputTab === 'questionnaire' ? 700 : 500, borderRadius: 8, border: 'none', cursor: 'pointer', background: activeInputTab === 'questionnaire' ? 'var(--bg-surface)' : 'transparent', color: activeInputTab === 'questionnaire' ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: activeInputTab === 'questionnaire' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                      No File
                    </button>
                  </div>
                </div>

                <div style={{ padding: '20px 20px 16px' }}>

                  {/* ═══ CONFIRMATION SCREEN ═══ */}
                  {showConfirmScreen ? (
                    <div style={{ animation: 'slideUp 0.3s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>&#10003;</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>
                            {inputSource === 'resume' ? 'Resume Parsed!' : 'LinkedIn PDF Parsed!'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {inputSource === 'resume' ? resumeFileName : pdfFileName} &mdash; Review and confirm your details
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Name</label>
                          <input value={confirmName} onChange={e => setConfirmName(e.target.value)} placeholder="Your name"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                            Headline / Job Title <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input value={confirmHeadline} onChange={e => setConfirmHeadline(e.target.value)} placeholder="e.g. Senior Manager | B2B Sales | 6+ Years"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                          {confirmHeadline.length > 0 && confirmHeadline.trim().length < 10 && (
                            <p style={{ fontSize: 11, color: '#CC1016', marginTop: 2 }}>Please add a complete headline.</p>
                          )}
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Experience</label>
                          <textarea value={confirmExperience} onChange={e => setConfirmExperience(e.target.value)} placeholder="Your work experience..." rows={3}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Education</label>
                          <textarea value={confirmEducation} onChange={e => setConfirmEducation(e.target.value)} placeholder="Your education..." rows={2}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Skills</label>
                          <input value={confirmSkills} onChange={e => setConfirmSkills(e.target.value)} placeholder="Python, React, Project Management..."
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ background: 'var(--accent-subtle)', border: '1px solid #C7D2FE', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 4, display: 'block' }}>What role are you targeting?</label>
                          <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Product Manager at a Series B startup"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box', background: 'white' }} />
                        </div>
                      </div>

                      <button
                        onClick={handleConfirmAndScore}
                        disabled={loading || confirmHeadline.trim().length < 10}
                        className="saas-btn saas-btn-primary"
                        style={{
                          width: '100%', padding: '14px 24px', borderRadius: 'var(--radius-pill)', border: 'none',
                          fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 14,
                          opacity: loading || confirmHeadline.trim().length < 10 ? 0.5 : 1,
                          boxShadow: 'var(--shadow-md)',
                        }}
                      >
                        {loading ? (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                            Analyzing...
                          </span>
                        ) : 'Get My Free Score \u2192'}
                      </button>
                      <div onClick={resetUpload} style={{ fontSize: 12, color: 'var(--accent)', textAlign: 'center', marginTop: 8, cursor: 'pointer', textDecoration: 'underline' }}>
                        Upload a different file
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ═══ TAB 1: RESUME UPLOAD ═══ */}
                      {activeInputTab === 'resume' && (
                        <div>
                          <div
                            onClick={() => resumeInputRef.current?.click()}
                            onDrop={(e) => { e.preventDefault(); setResumeDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) uploadAndParseResume(f); }}
                            onDragOver={(e) => { e.preventDefault(); setResumeDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setResumeDragOver(false); }}
                            style={{
                              position: 'relative',
                              border: `2px dashed ${resumeDragOver ? 'var(--accent)' : resumeParsed ? 'var(--success)' : 'rgba(15, 23, 42, 0.12)'}`,
                              borderRadius: 16, padding: '36px 24px', textAlign: 'center', marginBottom: 14,
                              background: resumeDragOver
                                ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)'
                                : resumeParsed
                                  ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(16, 185, 129, 0.03) 100%)'
                                  : 'linear-gradient(180deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.8) 100%)',
                              cursor: resumeUploading ? 'wait' : 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: resumeDragOver ? 'scale(1.01)' : 'scale(1)',
                            }}
                          >
                            <input ref={resumeInputRef} type="file" accept=".pdf,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndParseResume(f); }} style={{ display: 'none' }} />
                            {resumeUploading ? (
                              <>
                                <div style={{ width: 48, height: 48, margin: '0 auto 12px', border: '3px solid rgba(79, 70, 229, 0.15)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>Parsing your resume...</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Extracting your data &bull; 5-10 seconds</div>
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                              </>
                            ) : (
                              <>
                                <div style={{
                                  width: 56, height: 56, borderRadius: 16,
                                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(99, 102, 241, 0.06))',
                                  border: '1px solid rgba(79, 70, 229, 0.16)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  margin: '0 auto 16px',
                                  color: 'var(--accent)',
                                }}>
                                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="12" y1="18" x2="12" y2="12" />
                                    <polyline points="9 15 12 12 15 15" />
                                  </svg>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{resumeDragOver ? 'Drop to upload' : 'Drop resume or click to browse'}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>PDF or DOCX &bull; up to 10MB</div>
                              </>
                            )}
                          </div>

                          {resumeError && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#DC2626' }}>
                              {resumeError}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                            <span>&#128274; Encrypted</span>
                            <span>&#9889; Instant</span>
                            <span>&#127873; Free</span>
                          </div>
                        </div>
                      )}

                      {/* ═══ TAB 2: LINKEDIN PDF ═══ */}
                      {activeInputTab === 'linkedin' && (
                        <div>
                          <div
                            onClick={() => pdfInputRef.current?.click()}
                            onDrop={(e) => { e.preventDefault(); setPdfDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) uploadAndParsePdf(f); }}
                            onDragOver={(e) => { e.preventDefault(); setPdfDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setPdfDragOver(false); }}
                            style={{
                              border: `2px dashed ${pdfDragOver ? 'var(--accent)' : pdfParsed ? 'var(--success)' : '#94B8DB'}`,
                              borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center', marginBottom: 10,
                              background: pdfDragOver ? '#E8F0FE' : pdfParsed ? 'var(--success-subtle)' : '#F0F7FF',
                              cursor: pdfUploading ? 'wait' : 'pointer', transition: 'all var(--transition)',
                            }}
                          >
                            <input ref={pdfInputRef} type="file" accept=".pdf" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndParsePdf(f); }} style={{ display: 'none' }} />
                            {pdfUploading ? (
                              <>
                                <div aria-hidden="true" style={{ fontSize: 28, marginBottom: 6, animation: 'spin 1s linear infinite' }}>&#9881;</div>
                                <div role="status" aria-live="polite" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>Parsing your LinkedIn PDF...</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Extracting profile data &bull; 5-10 seconds</div>
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                              </>
                            ) : (
                              <>
                                <div aria-hidden="true" style={{ fontSize: 40, marginBottom: 8 }}>&#128188;</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{pdfDragOver ? 'Drop your PDF here!' : 'Drop your LinkedIn PDF here'}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>or click to browse &bull; .pdf only</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                                  LinkedIn &rarr; Your Profile &rarr; More &rarr; Save to PDF
                                </div>
                              </>
                            )}
                          </div>

                          {pdfError && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#DC2626' }}>
                              {pdfError}
                            </div>
                          )}

                          {/* How to get LinkedIn PDF guide */}
                          <details style={{ marginTop: 8 }}>
                            <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              &#128161; How to download your LinkedIn PDF
                            </summary>
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>&#128187; Desktop:</div>
                              {['Go to your LinkedIn profile', 'Click "More" \u2192 "Save to PDF"', 'Upload the downloaded file here'].map((s, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 11 }}>
                                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                                  <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                                </div>
                              ))}
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>&#128241; Mobile:</div>
                              {['Open Chrome/Safari (not the app)', 'Request Desktop Site', 'Profile \u2192 More \u2192 Save to PDF'].map((s, i) => (
                                <div key={`m${i}`} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#FEF3C7', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 11 }}>
                                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#D97706', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                                  <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                                </div>
                              ))}
                              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textAlign: 'center', marginTop: 4 }}>
                                Easier: Switch to the Resume tab and upload your resume instead!
                              </div>
                            </div>
                          </details>
                        </div>
                      )}

                      {/* ═══ TAB 3: QUESTIONNAIRE ═══ */}
                      {activeInputTab === 'questionnaire' && (
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                            No resume or LinkedIn PDF? No problem. Tell us about yourself and we{"'"}ll build your profile.
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Full Name</label>
                              <input value={qName} onChange={e => setQName(e.target.value)} placeholder="Your full name"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                                Current Job Title / Headline <span style={{ color: '#DC2626' }}>*</span>
                              </label>
                              <input value={qHeadline} onChange={e => setQHeadline(e.target.value)} placeholder="e.g. Final Year B.Tech Student | Aspiring Data Analyst"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                                Target Role <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>what job are you applying for?</span>
                              </label>
                              <input value={qTargetRole} onChange={e => setQTargetRole(e.target.value)} placeholder="e.g. Data Analyst at a tech company"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                                Experience <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>internships, jobs, projects</span>
                              </label>
                              <textarea value={qExperience} onChange={e => setQExperience(e.target.value)} placeholder="List your work experience, internships, or key projects..." rows={3}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Education</label>
                              <textarea value={qEducation} onChange={e => setQEducation(e.target.value)} placeholder="e.g. B.Tech Computer Science, XYZ University, 2024" rows={2}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Skills</label>
                              <input value={qSkills} onChange={e => setQSkills(e.target.value)} placeholder="Python, SQL, Excel, Communication..."
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                          </div>

                          <button
                            onClick={handleQuestionnaireSubmit}
                            disabled={loading || qHeadline.trim().length < 10}
                            className="saas-btn saas-btn-primary"
                            style={{
                              width: '100%', padding: '14px 24px', borderRadius: 'var(--radius-pill)', border: 'none',
                              fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 14,
                              opacity: loading || qHeadline.trim().length < 10 ? 0.5 : 1,
                              boxShadow: 'var(--shadow-md)',
                            }}
                          >
                            {loading ? 'Processing...' : 'Get My Free Score \u2192'}
                          </button>
                        </div>
                      )}

                      {/* ═══ TAB 4: STUDENT / FRESHER ═══ */}
                      {activeInputTab === 'student' && (
                        <div style={{ padding: '16px 0' }}>
                          {/* Step indicator */}
                          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                            {[1, 2, 3, 4].map(s => (
                              <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: studentStep >= s ? 'var(--accent)' : '#E0E0E0', transition: 'background 0.3s' }} />
                            ))}
                          </div>

                          {studentStep === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#191919', marginBottom: 4 }}>Basic Info</div>
                              <input placeholder="Full Name *" value={studentName} onChange={e => setStudentName(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <input placeholder="College / University *" value={studentCollege} onChange={e => setStudentCollege(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                                <select value={studentDegree} onChange={e => setStudentDegree(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: 'white' }}>
                                  <option value="">Select Degree</option>
                                  <option value="B.Tech">B.Tech</option>
                                  <option value="B.E.">B.E.</option>
                                  <option value="BCA">BCA</option>
                                  <option value="MCA">MCA</option>
                                  <option value="M.Tech">M.Tech</option>
                                  <option value="BSc">B.Sc</option>
                                  <option value="MSc">M.Sc</option>
                                  <option value="MBA">MBA</option>
                                  <option value="BBA">BBA</option>
                                  <option value="B.Com">B.Com</option>
                                  <option value="M.Com">M.Com</option>
                                  <option value="BA">B.A.</option>
                                  <option value="MA">M.A.</option>
                                  <option value="B.Pharm">B.Pharm</option>
                                  <option value="LLB">LLB</option>
                                  <option value="Diploma">Diploma</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <input placeholder="Branch / Major (CSE, ECE...)" value={studentBranch} onChange={e => setStudentBranch(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                                <select value={studentGradYear} onChange={e => setStudentGradYear(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: 'white' }}>
                                  {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={String(y)}>{y}</option>)}
                                </select>
                              </div>
                              <input placeholder="City (e.g., Hyderabad)" value={studentLocation} onChange={e => setStudentLocation(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <button disabled={!studentName.trim() || !studentCollege.trim()} onClick={() => setStudentStep(2)} style={{ padding: '12px', background: !studentName.trim() || !studentCollege.trim() ? '#D1D5DB' : 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Next &rarr;</button>
                            </div>
                          )}

                          {studentStep === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#191919', marginBottom: 4 }}>What Job Are You Looking For?</div>
                              <input placeholder="Target Role * (e.g., Software Developer)" value={studentTargetRole} onChange={e => setStudentTargetRole(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <div style={{ fontSize: 12, color: '#666', marginTop: -4 }}>Not sure? Common roles for {studentBranch || 'your branch'}:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {(
                                  // CSE/IT
                                  studentBranch.toLowerCase().match(/cs|it|computer|software|information tech/)
                                    ? ['Software Developer', 'Data Analyst', 'Web Developer', 'QA Engineer', 'DevOps Engineer', 'Cloud Engineer']
                                  // ECE/EEE/Electrical
                                  : studentBranch.toLowerCase().match(/ec|electronics|electrical|eee/)
                                    ? ['Embedded Engineer', 'VLSI Designer', 'Network Engineer', 'IoT Developer', 'Test Engineer']
                                  // Mechanical/Civil/Core
                                  : studentBranch.toLowerCase().match(/mech|civil|auto|aero|chemical|production/)
                                    ? ['Design Engineer', 'Production Engineer', 'Quality Engineer', 'Project Engineer', 'Site Engineer']
                                  // MBA/BBA/Management
                                  : studentBranch.toLowerCase().match(/mba|bba|management|business/)
                                    ? ['Business Analyst', 'Marketing Manager', 'HR Executive', 'Product Manager', 'Operations Manager']
                                  // Commerce/Finance
                                  : studentBranch.toLowerCase().match(/com|finance|accounting|ca|cma/)
                                    ? ['Financial Analyst', 'Accountant', 'Auditor', 'Tax Consultant', 'Investment Analyst']
                                  // Arts/Humanities
                                  : studentBranch.toLowerCase().match(/arts|english|history|sociology|psychology|journalism/)
                                    ? ['Content Writer', 'HR Executive', 'Research Analyst', 'Public Relations', 'Social Media Manager']
                                  // Science/BSc
                                  : studentBranch.toLowerCase().match(/physics|chemistry|math|bio|science|bsc/)
                                    ? ['Data Analyst', 'Lab Technician', 'Research Associate', 'Quality Analyst', 'Science Teacher']
                                  // BCA/MCA
                                  : studentBranch.toLowerCase().match(/bca|mca/)
                                    ? ['Software Developer', 'Web Developer', 'Data Analyst', 'System Administrator', 'App Developer']
                                  // Pharmacy
                                  : studentBranch.toLowerCase().match(/pharm/)
                                    ? ['Medical Representative', 'Quality Control', 'Drug Inspector', 'Clinical Research', 'Pharmacist']
                                  // Default
                                  : ['Software Developer', 'Data Analyst', 'Business Analyst', 'Marketing Executive', 'HR Executive']
                                ).map(r => (
                                  <button key={r} onClick={() => setStudentTargetRole(r)} style={{ padding: '4px 12px', borderRadius: 16, border: studentTargetRole === r ? '2px solid var(--accent)' : '1px solid #D1D5DB', background: studentTargetRole === r ? '#EEF2FF' : 'white', fontSize: 12, cursor: 'pointer', color: '#191919' }}>{r}</button>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button onClick={() => setStudentStep(1)} style={{ flex: 1, padding: '12px', background: 'white', color: '#666', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>&larr; Back</button>
                                <button disabled={!studentTargetRole.trim()} onClick={() => setStudentStep(3)} style={{ flex: 2, padding: '12px', background: !studentTargetRole.trim() ? '#D1D5DB' : 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Next &rarr;</button>
                              </div>
                            </div>
                          )}

                          {studentStep === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>Experience &amp; Projects</div>
                              <div style={{ fontSize: 12, color: '#666', marginTop: -8 }}>Don{"'"}t worry if you don{"'"}t have much — most freshers don{"'"}t</div>
                              <textarea placeholder={"Internships (if any)\ne.g., Web Dev Intern at TCS, 3 months\nBuilt a dashboard using React..."} value={studentInternships} onChange={e => setStudentInternships(e.target.value)} rows={3} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
                              <textarea placeholder={"Projects\ne.g., E-commerce app using React + Node\nChat app with Socket.io..."} value={studentProjects} onChange={e => setStudentProjects(e.target.value)} rows={3} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setStudentStep(2)} style={{ flex: 1, padding: '12px', background: 'white', color: '#666', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>&larr; Back</button>
                                <button onClick={() => setStudentStep(4)} style={{ flex: 2, padding: '12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Next &rarr;</button>
                              </div>
                            </div>
                          )}

                          {studentStep === 4 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>Skills &amp; Extras</div>
                              <input placeholder="Skills (comma-separated) * e.g., Python, Java, SQL, React, Git" value={studentSkills} onChange={e => setStudentSkills(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <input placeholder="Certifications (optional) e.g., AWS Cloud, Google Analytics" value={studentCertifications} onChange={e => setStudentCertifications(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <textarea placeholder={"Achievements (optional)\ne.g., Won Smart India Hackathon, NSS Volunteer, Class Rep"} value={studentAchievements} onChange={e => setStudentAchievements(e.target.value)} rows={2} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
                              <input placeholder="Email *" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} type="email" style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <input placeholder="Phone (optional)" value={studentPhone} onChange={e => setStudentPhone(e.target.value)} type="tel" style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />

                              {/* Summary */}
                              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 14px', marginTop: 4 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#057642', marginBottom: 4 }}>{studentName} — {studentDegree} {studentBranch}, {studentCollege}</div>
                                <div style={{ fontSize: 12, color: '#666' }}>Target: {studentTargetRole} | Grad: {studentGradYear} | {studentSkills ? studentSkills.split(',').length + ' skills' : '0 skills'}{studentInternships ? ' | Has internship' : ''}{studentProjects ? ' | Has projects' : ''}</div>
                              </div>

                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setStudentStep(3)} style={{ flex: 1, padding: '12px', background: 'white', color: '#666', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>&larr; Back</button>
                                <button
                                  disabled={!studentSkills.trim() || !studentEmail.trim()}
                                  onClick={async () => {
                                    const formInput = {
                                      full_name: studentName,
                                      email: studentEmail,
                                      phone: studentPhone,
                                      location: studentLocation,
                                      career_stage: 'student',
                                      education: [{
                                        institution: studentCollege,
                                        degree: studentDegree,
                                        field: studentBranch,
                                        year: studentGradYear,
                                        coursework: '',
                                      }],
                                      experience: [],
                                      skills: studentSkills.split(',').map((s: string) => s.trim()).filter(Boolean),
                                      certifications: studentCertifications.split(',').map((s: string) => s.trim()).filter(Boolean),
                                      achievements: studentAchievements,
                                      projects: studentProjects,
                                      target_role: studentTargetRole,
                                      target_industry: '',
                                      tone: 'professional',
                                      internships: studentInternships,
                                    };
                                    setStudentFormData(formInput);
                                    document.getElementById('student-pricing')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  style={{ flex: 2, padding: '12px', background: !studentSkills.trim() || !studentEmail.trim() ? '#D1D5DB' : '#057642', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Build My Resume — &#8377;199 &rarr;
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Shimmer loading indicator */}
                      {loading && !teaser && (
                        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', padding: '20px 24px', marginTop: 16 }}>
                          <style>{`
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes countUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                          `}</style>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{loadingStage}</span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, var(--accent), #057642)', transition: 'width 1s ease', width: `${loadingProgress}%` }} />
                          </div>
                          {/* Skeleton lines */}
                          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                            {[75, 60, 45].map((w, i) => (
                              <div key={i} style={{ height: 12, borderRadius: 6, width: `${w}%`, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rate limited */}
                      {rateLimited && !teaser && (
                        <div style={{ marginTop: 10, padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--warning-subtle)', border: '1px solid var(--warning)' }}>
                          <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>5 free previews used today.</div>
                          <button onClick={scrollToPricing} className="saas-btn saas-btn-primary" style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 700 }}>Get Full Report &#8377;499 &rarr;</button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Trust line — hide when rate limited */}
                  {!rateLimited && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                        <span>Free score</span>
                        <span style={{ color: 'var(--border-strong)' }}>·</span>
                        <span>No signup</span>
                        <span style={{ color: 'var(--border-strong)' }}>·</span>
                        <span>Results in seconds</span>
                      </span>
                    </div>
                  )}

                </div>
              </div>
            </div>
        </div>
      </section>

      {/* ── Product Dashboard Preview — Desktop */}
      <section className="hidden md:block" style={{ padding: '40px 0 80px', background: 'var(--bg-canvas)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #D1D5DB', boxShadow: '0 25px 80px rgba(15,23,42,0.14)', overflow: 'hidden' }}>
            {/* Browser bar */}
            <div style={{ height: 40, background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F87171' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FBBF24' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34D399' }} />
              <div style={{ flex: 1, marginLeft: 16, height: 24, background: 'white', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 10, color: '#94A3B8' }}>
                <span style={{ color: '#34D399', marginRight: 4 }}>&#128274;</span> app.profileroaster.in/linkedin-review
              </div>
            </div>

            <div style={{ display: 'flex', minHeight: 520 }}>
              {/* Sidebar */}
              <div style={{ width: 190, background: '#FAFBFC', borderRight: '1px solid #E5E7EB', padding: '16px 0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '4px 16px 16px', fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid #E5E7EB', marginBottom: 8 }}>
                  <span style={{ color: '#4F46E5' }}>Profile</span>Roaster
                </div>
                {[
                  { label: 'Dashboard', icon: '▦', active: false },
                  { label: 'LinkedIn Review', icon: '◉', active: true },
                  { label: 'Resume Builder', icon: '◧', active: false },
                  { label: 'ATS Match', icon: '◈', active: false },
                  { label: 'Interview Prep', icon: '◇', active: false },
                  { label: 'Export', icon: '↗', active: false },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '7px 14px', fontSize: 11, fontWeight: item.active ? 600 : 400, color: item.active ? '#4F46E5' : '#64748B', background: item.active ? '#EEF2FF' : 'transparent', borderLeft: item.active ? '3px solid #4F46E5' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, opacity: 0.6 }}>{item.icon}</span>{item.label}
                  </div>
                ))}
                {/* Sidebar bottom stats */}
                <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', letterSpacing: 1, marginBottom: 6 }}>QUICK STATS</div>
                  <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>Profile Score: <span style={{ color: '#15803D', fontWeight: 700 }}>87/100</span></div>
                  <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>Keywords: <span style={{ color: '#4F46E5', fontWeight: 700 }}>14/16</span></div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>ATS Ready: <span style={{ color: '#15803D', fontWeight: 700 }}>Yes</span></div>
                </div>
              </div>

              {/* Main content */}
              <div style={{ flex: 1, padding: '16px 20px', overflow: 'hidden', background: '#F8FAFC' }}>
                {/* Toolbar row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 0, background: 'white', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    {['Overview', 'Headline', 'Summary', 'Experience', 'Skills'].map((tab, i) => (
                      <div key={tab} style={{ padding: '6px 12px', fontSize: 10, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? '#4F46E5' : '#94A3B8', background: i === 0 ? '#EEF2FF' : 'white', borderRight: i < 4 ? '1px solid #E2E8F0' : 'none', cursor: 'default' }}>
                        {tab}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: '#94A3B8' }}>Last scan: 2 min ago</span>
                    <div style={{ padding: '4px 8px', background: '#4F46E5', color: 'white', borderRadius: 6, fontSize: 9, fontWeight: 600 }}>Re-analyze</div>
                  </div>
                </div>

                {/* Score summary row */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Profile Score', value: '87', sub: '/100', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
                    { label: 'ATS Match', value: '92', sub: '%', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
                    { label: 'Recruiter Score', value: 'A+', sub: '', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
                    { label: 'Keywords', value: '14', sub: '/16', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
                  ].map((m, i) => (
                    <div key={i} style={{ flex: 1, background: m.bg, borderRadius: 10, padding: '10px', border: `1px solid ${m.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}<span style={{ fontSize: 10, fontWeight: 600 }}>{m.sub}</span></div>
                      <div style={{ fontSize: 8, color: '#64748B', marginTop: 3, fontWeight: 600 }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Two profile cards */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  {/* Original Profile — faded */}
                  <div style={{ flex: '0 0 38%', background: '#F0F0F0', borderRadius: 12, padding: '12px 14px', border: '1px solid #D1D5DB', opacity: 0.6, position: 'relative', filter: 'grayscale(0.3)' }}>
                    <div style={{ position: 'absolute', top: 8, right: 8, padding: '2px 6px', background: '#FEE2E2', color: '#DC2626', borderRadius: 4, fontSize: 8, fontWeight: 700 }}>NEEDS WORK</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, marginBottom: 8 }}>ORIGINAL PROFILE</div>
                    <div style={{ height: 3, background: '#E2E8F0', borderRadius: 2, marginBottom: 10 }}><div style={{ height: '100%', width: '42%', background: '#F87171', borderRadius: 2 }} /></div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <img
                        src="https://api.dicebear.com/9.x/notionists/svg?seed=rajesh-original&backgroundColor=e2e8f0,d1d5db"
                        alt="Original profile"
                        style={{ width: 28, height: 28, borderRadius: '50%', background: '#E5E7EB', filter: 'grayscale(0.6)' }}
                      />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Rajesh Kumar</div>
                        <div style={{ fontSize: 8, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span>Software Engineer</span>
                          <span>·</span>
                          <span>Updated 2d ago</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.4, padding: '6px 8px', background: '#E5E7EB', borderRadius: 6, marginBottom: 8, textDecoration: 'line-through', fontStyle: 'italic' }}>
                      &ldquo;Results-driven professional seeking opportunities&rdquo;
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, marginBottom: 4 }}>ABOUT</div>
                    <div style={{ fontSize: 9, color: '#94A3B8', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>
                      <span style={{ textDecoration: 'line-through' }}>Hard-working professional with excellent communication skills and a passion for excellence. Looking for new opportunities to grow.</span>
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, marginBottom: 4 }}>EXPERIENCE</div>
                    <div style={{ fontSize: 9, color: '#9CA3AF', lineHeight: 1.5, marginBottom: 8 }}>
                      <div style={{ textDecoration: 'line-through' }}>· Worked on various projects</div>
                      <div style={{ textDecoration: 'line-through' }}>· Handled day-to-day operations</div>
                      <div style={{ textDecoration: 'line-through' }}>· Participated in team meetings</div>
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {['Weak headline', 'No metrics', '12 keywords missing'].map(w => (
                        <span key={w} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 5px', background: '#FEE2E2', color: '#DC2626', borderRadius: 3, fontSize: 7, fontWeight: 600 }}>
                          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, flexDirection: 'column', gap: 4 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, boxShadow: '0 4px 12px rgba(79, 70, 229,0.35)' }}>→</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#4F46E5' }}>AI Fix</div>
                  </div>

                  {/* Optimized Profile — dominant */}
                  <div style={{ flex: '0 0 54%', background: 'white', borderRadius: 14, padding: '16px 18px', border: '2px solid #86EFAC', boxShadow: '0 12px 36px rgba(16,185,129,0.16), 0 0 0 4px rgba(134,239,172,0.1)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 8, right: 8, padding: '2px 6px', background: '#DCFCE7', color: '#15803D', borderRadius: 4, fontSize: 8, fontWeight: 700 }}>✓ OPTIMIZED</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#15803D', letterSpacing: 1 }}>OPTIMIZED PROFILE</span>
                      <svg width="36" height="36" style={{ flexShrink: 0 }}>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#34D399" strokeWidth="3" strokeDasharray={`${0.87 * 2 * Math.PI * 14} ${2 * Math.PI * 14}`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                        <text x="18" y="19" textAnchor="middle" fontSize="8" fontWeight="800" fill="#15803D" dominantBaseline="middle" fontFamily="Inter">87</text>
                      </svg>
                    </div>
                    <div style={{ height: 3, background: '#E5E7EB', borderRadius: 2, marginBottom: 10 }}><div style={{ height: '100%', width: '87%', background: '#34D399', borderRadius: 2 }} /></div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <img
                        src="https://api.dicebear.com/9.x/notionists/svg?seed=rajesh-optimized&backgroundColor=c7d2fe,ddd6fe,fbcfe8"
                        alt="Optimized profile"
                        style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF2FF' }}
                      />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>Rajesh Kumar</div>
                        <div style={{ fontSize: 8, color: '#15803D', display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />Updated just now</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#15803D', lineHeight: 1.4, padding: '6px 8px', background: '#F0FDF4', borderRadius: 6, marginBottom: 6, fontWeight: 600, borderLeft: '2px solid #34D399' }}>
                      &ldquo;Full-Stack Engineer | Built apps serving 50K+ users | React + AWS + Node.js&rdquo;
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#4F46E5', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ padding: '1px 4px', background: '#EEF2FF', borderRadius: 3, fontSize: 7 }}>AI Suggestion</span> Summary rewritten
                    </div>
                    <div style={{ fontSize: 9, color: '#374151', lineHeight: 1.5, marginBottom: 8 }}>
                      Full-stack engineer with 5 years shipping production apps at scale. Led microservices migration for <span style={{ background: '#D1FAE5', padding: '0 2px', borderRadius: 2 }}>50K+ DAU</span>. Reduced API latency by <span style={{ background: '#D1FAE5', padding: '0 2px', borderRadius: 2 }}>40%</span>. Mentored 4 junior devs.
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>KEYWORDS ADDED</div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>
                      {['React', 'Node.js', 'AWS', 'Docker', 'CI/CD', 'Microservices', 'PostgreSQL', 'TypeScript'].map(w => (
                        <span key={w} style={{ padding: '1px 5px', background: '#DCFCE7', color: '#15803D', borderRadius: 3, fontSize: 7, fontWeight: 600 }}>+ {w}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['✓ ATS Ready', '✓ Recruiter Friendly', '✓ Quantified'].map(w => (
                        <span key={w} style={{ padding: '2px 5px', background: '#F0FDF4', color: '#15803D', borderRadius: 4, fontSize: 7, fontWeight: 700, border: '1px solid #BBF7D0' }}>{w}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom row: metrics + mini resume preview */}
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                    {[
                      { label: 'Recruiter Match', value: '+38%', color: '#4F46E5' },
                      { label: 'Score Jump', value: '42→87', color: '#15803D' },
                      { label: 'Strength', value: 'Strong', color: '#F59E0B' },
                    ].map((m, i) => (
                      <div key={i} style={{ flex: 1, background: 'white', borderRadius: 8, padding: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: 7, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mini resume thumbnail */}
                  <div style={{ width: 80, background: 'white', borderRadius: 8, border: '1px solid #E2E8F0', padding: '6px', flexShrink: 0 }}>
                    <div style={{ fontSize: 6, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Resume</div>
                    <div style={{ height: 3, background: '#E2E8F0', borderRadius: 1, marginBottom: 2 }} />
                    <div style={{ height: 3, background: '#E2E8F0', borderRadius: 1, marginBottom: 2, width: '80%' }} />
                    <div style={{ height: 3, background: '#E2E8F0', borderRadius: 1, width: '60%' }} />
                    <div style={{ fontSize: 5, color: '#4F46E5', fontWeight: 600, marginTop: 3 }}>View →</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Dashboard Preview — Mobile */}
      <section className="md:hidden" style={{ padding: '24px 0 48px', background: 'var(--bg-canvas)' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
            {/* Mini browser bar */}
            <div style={{ height: 36, background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F87171' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FBBF24' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
              <div style={{ flex: 1, marginLeft: 8, height: 22, background: '#F1F5F9', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 9, color: '#94A3B8' }}>profileroaster.in</div>
            </div>
            {/* Optimized profile card only */}
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', letterSpacing: 1 }}>OPTIMIZED PROFILE</span>
                <span style={{ padding: '3px 10px', background: '#DCFCE7', color: '#15803D', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>87/100</span>
              </div>
              <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, marginBottom: 14 }}><div style={{ height: '100%', width: '87%', background: '#34D399', borderRadius: 2 }} /></div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <img
                  src="https://api.dicebear.com/9.x/notionists/svg?seed=rajesh-optimized&backgroundColor=c7d2fe,ddd6fe,fbcfe8"
                  alt="Optimized profile"
                  style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEF2FF' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Rajesh Kumar</div>
                  <div style={{ fontSize: 11, color: '#15803D', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                    Updated just now · 12 recruiter views
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#15803D', lineHeight: 1.5, padding: '10px 12px', background: '#F0FDF4', borderRadius: 10, marginBottom: 12, fontWeight: 600, borderLeft: '3px solid #34D399' }}>
                &ldquo;Full-Stack Engineer | Built apps serving 50K+ users | React + AWS&rdquo;
              </div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
                Full-stack engineer with 5 years shipping production applications. Led microservices migration for 50K+ DAU. Reduced API latency by 40%.
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['ATS Optimized', '12 Keywords', 'Recruiter Ready'].map(w => (
                  <span key={w} style={{ padding: '3px 8px', background: '#DCFCE7', color: '#15803D', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{w}</span>
                ))}
              </div>
            </div>
            {/* Bottom metric */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 8 }}>
              {[
                { label: 'Recruiter Match', value: '+38%', color: '#4F46E5' },
                { label: 'Keywords Added', value: '12', color: '#15803D' },
                { label: 'Score Jump', value: '42→87', color: '#F59E0B' },
              ].map((m, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 9, color: '#94A3B8' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* before/after sections moved below — render just before pricing for stronger conversion */}

      {/* ═══════════════════════════════════ */}
      {/* RESUME & COVER LETTER SHOWCASE      */}
      {/* ═══════════════════════════════════ */}
      <TemplatesShowcase />

      {/* ═══════════════════════════════════ */}
      {/* TEASER RESULT                       */}
      {/* ═══════════════════════════════════ */}
      {teaser && (
        <section ref={resultRef} style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', padding: '48px 0', animation: 'fadeInUp 0.5s ease forwards' }}>
          <div className="landing-section">
            <div style={{ marginBottom: 24 }}>
              <div className="saas-eyebrow" style={{ marginBottom: 8 }}>Your free preview</div>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Here{"'"}s what we found</h2>
            </div>

            <div style={{ maxWidth: 700, margin: '24px auto 0' }}>
              {/* Score + Subscores Card */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 16 }}>
                {/* Score header */}
                <div style={{ background: teaser.score < 50 ? 'linear-gradient(135deg, #DC2626, #991B1B)' : teaser.score < 70 ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #057642, #16A34A)', padding: '28px 32px', color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, opacity: 0.8, marginBottom: 8, textTransform: 'uppercase' as const }}>Your Profile Score</div>
                  <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>{teaser.score}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, opacity: 0.9 }}>{teaser.verdict === 'needs work' ? 'Needs Significant Work' : teaser.verdict === 'decent' ? 'Decent \u2014 Could Be Stronger' : teaser.score < 50 ? 'Needs Significant Work' : teaser.score < 70 ? 'Decent \u2014 Could Be Stronger' : 'Strong Profile'}</div>
                  {teaser.ranking_percentile && (
                    <div style={{ marginTop: 10, fontSize: 13, background: 'rgba(0,0,0,0.2)', display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>
                      Your profile ranks in the bottom {100 - (teaser.ranking_percentile || 50)}% of applicants
                    </div>
                  )}
                </div>

                {/* Subscores */}
                {teaser.subscores && (
                  <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      { label: 'ATS Keywords', score: teaser.subscores.ats_keywords, color: 'var(--accent)' },
                      { label: 'Experience Impact', score: teaser.subscores.experience_impact, color: '#7C3AED' },
                      { label: 'Headline Strength', score: teaser.subscores.headline_strength, color: '#E16B00' },
                      { label: 'Job Readiness', score: teaser.subscores.overall_readiness, color: '#057642' },
                    ].map((s, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                          <span>{s.label}</span>
                          <span style={{ color: s.score < 50 ? '#DC2626' : s.score < 70 ? '#D97706' : '#057642' }}>{s.score}/100</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: '#E5E7EB' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: s.color, width: `${s.score}%`, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Missing Keywords */}
                {teaser.missing_keywords && teaser.missing_keywords.length > 0 && (
                  <div style={{ padding: '0 32px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>Missing ATS Keywords — recruiters search for these:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {teaser.missing_keywords.map((kw: string, i: number) => (
                        <span key={i} style={{ background: '#FEF2F2', color: '#DC2626', padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, border: '1px solid #FECACA' }}>+ {kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Improvement */}
                {teaser.sample_improvement && (
                  <div style={{ padding: '0 32px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>AI improved this from your profile:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', textDecoration: 'line-through' }}>{teaser.sample_improvement.before}</div>
                      <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>{'\u2193'} AI rewrote this to {'\u2193'}</div>
                      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#057642', fontWeight: 600 }}>{teaser.sample_improvement.after}</div>
                    </div>
                  </div>
                )}

                {/* Blurred headline */}
                <div style={{ padding: '0 32px 24px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Your AI-optimized headline:</div>
                  <div style={{ position: 'relative', background: '#F0F7FF', borderRadius: 10, padding: '14px 18px', overflow: 'hidden' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#191919', filter: 'blur(5px)', userSelect: 'none' as const }}>{teaser.suggested_headline || 'Your optimized headline will appear here...'}</div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(240,247,255,0.7)' }}>
                      <span style={{ background: 'var(--accent)', color: 'white', padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer' }} onClick={scrollToPricing}>Unlock Full Rewrite {'\u2192'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interview question (kept visible) */}
              {teaser.sample_interview_question && (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6 }}>A Recruiter Would Ask You</div>
                  <div style={{ fontSize: 14, color: '#191919', fontWeight: 500, lineHeight: 1.5 }}>{teaser.sample_interview_question}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>14 more personalized questions in full kit</div>
                </div>
              )}

              {/* Referral code */}
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                {!showTeaserReferral ? (
                  <button onClick={() => setShowTeaserReferral(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Have a referral code?
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <input
                      value={teaserReferralCode}
                      onChange={e => setTeaserReferralCode(e.target.value.toUpperCase())}
                      placeholder="Enter referral code"
                      style={{ padding: '10px 14px', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', width: 200 }}
                    />
                    <input
                      value={teaserReferralEmail}
                      onChange={e => setTeaserReferralEmail(e.target.value)}
                      placeholder="Your email"
                      type="email"
                      style={{ padding: '10px 14px', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13, width: 200 }}
                    />
                    <button
                      onClick={async () => {
                        if (!teaserReferralCode.trim() || !teaserReferralEmail.trim()) return;
                        setTeaserReferralRedeeming(true);
                        try {
                          const res = await fetch(`${API_URL}/api/redeem-code`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              code: teaserReferralCode.trim(),
                              email: teaserReferralEmail.trim(),
                              profile_data: { raw_paste: (inputSource === 'resume' ? resumeRawText : pdfRawPaste).trim() },
                              input_source: inputSource,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) { alert(data.error || 'Invalid code'); setTeaserReferralRedeeming(false); return; }
                          if (data.order_id) {
                            window.location.href = data.redirect_url || `/results/${data.order_id}`;
                          }
                        } catch { alert('Could not reach server.'); setTeaserReferralRedeeming(false); }
                      }}
                      disabled={teaserReferralRedeeming}
                      style={{ padding: '10px 18px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', opacity: teaserReferralRedeeming ? 0.6 : 1 }}
                    >
                      {teaserReferralRedeeming ? '...' : 'Redeem'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sparse profile warning for questionnaire users */}
            {inputSource === 'questionnaire' && !qExperience.trim() && !qSkills.trim() && (
              <div style={{ maxWidth: 700, margin: '16px auto 0' }}>
                <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>
                    Limited data detected
                  </div>
                  <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>
                    You only provided a headline. For a more accurate score and better results, add your experience and skills above.
                    Or upload your resume for the best results.
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => { setActiveInputTab('questionnaire'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: '6px 14px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Add More Details
                    </button>
                    <button onClick={() => { setActiveInputTab('resume'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: '6px 14px', background: 'white', color: '#92400E', border: '1px solid #F59E0B', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Upload Resume Instead
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3 Resume Previews */}
            {currentParsed && (() => {
              const resumeData = pdfToResumeData(currentParsed);
              const recIds = ['classic', 'salesbd', 'headline'];
              if (!resumeData) return null;
              return (
                <div style={{ marginBottom: 16, marginTop: 24 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {inputSource === 'resume' ? 'Your Resume' : 'Resume From Your LinkedIn'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Built from your data. 11 templates available.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    {recIds.map(tid => {
                      const tmpl = TEMPLATES.find(t => t.id === tid);
                      return (
                        <div key={tid} style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border-default)', background: 'var(--bg-surface)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                          onClick={scrollToPricing}>
                          <div style={{ height: 320, overflow: 'hidden' }}>
                            <div style={{ transform: 'scale(0.38)', transformOrigin: 'top left', width: '263%', pointerEvents: 'none' }}>
                              {renderResumeHTML(resumeData, tid)}
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(transparent, white)', zIndex: 2 }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px', background: 'var(--bg-surface)', borderTop: '1px solid #F0F0F0', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{tmpl?.name}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: 'white', padding: '5px 14px', borderRadius: 20 }}>
                              Unlock &rarr;
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Locked insights */}
            <div className="saas-card" style={{ padding: '24px', marginBottom: 20 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                Unlock your full analysis
              </p>
              {[
                { text: inputSource === 'resume' ? 'ATS keyword gaps + optimization tips' : '2 critical profile issues identified' },
                { text: inputSource === 'resume' ? 'AI-generated LinkedIn profile content' : 'ATS keyword gap analysis' },
                { text: '15 personalized interview questions + STAR answers' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 00-4 4v3H3a1 1 0 00-1 1v5a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1V5a4 4 0 00-4-4zm-2 4a2 2 0 114 0v3H6V5z" fill="var(--text-muted)"/></svg>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA strip */}
            <div style={{ background: 'var(--accent)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                {inputSource === 'resume'
                  ? 'Get Full Resume Rewrite + LinkedIn Profile + Interview Prep'
                  : 'Get Full Rewrite + Interview Prep + Resume'}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20, lineHeight: 1.5 }}>
                {inputSource === 'resume'
                  ? 'ATS-optimized resume + AI-generated LinkedIn content + interview prep'
                  : 'Complete profile rewrite + ATS resume + interview prep'}
              </p>
              <button
                onClick={scrollToPricing}
                style={{
                  width: '100%', padding: '16px 24px', borderRadius: 'var(--radius-pill)', border: 'none',
                  background: 'white', color: 'var(--accent)',
                  fontSize: 16, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                Unlock Everything &rarr;
              </button>
              <LiveCounter />
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════ */}
      {/* TESTIMONIALS (before pricing)       */}
      {/* ═══════════════════════════════════ */}
      {teaser && (
        <div style={{ maxWidth: 700, margin: '16px auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { text: 'Got 3 interview calls in the first week after updating my profile.', name: 'Rahul S.', role: 'Software Engineer, Bangalore' },
              { text: 'My ATS score went from 34 to 86. Finally getting shortlisted.', name: 'Priya M.', role: 'MBA Graduate, Mumbai' },
              { text: 'The interview prep was spot on. Used the STAR answers in my TCS interview.', name: 'Vikram K.', role: 'CSE Student, Hyderabad' },
            ].map((t, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px', fontSize: 13 }}>
                <div style={{ color: '#F59E0B', marginBottom: 8 }}>{'\u2605\u2605\u2605\u2605\u2605'}</div>
                <div style={{ color: '#374151', lineHeight: 1.5, marginBottom: 10 }}>&ldquo;{t.text}&rdquo;</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════ */}
      {/* BEFORE / AFTER — final convincer    */}
      {/* ═══════════════════════════════════ */}
      <BeforeAfter />

      {/* ═══════════════════════════════════ */}
      {/* PRICING                             */}
      {/* ═══════════════════════════════════ */}
      {(showPricing || teaser) && !selectedPlan && pricingSection}

      {/* Student Plan */}
      {inputSource === 'student' && studentFormData && (
        <div id="student-pricing" style={{ maxWidth: 440, margin: '24px auto 0', background: 'linear-gradient(135deg, #057642, #16A34A)', borderRadius: 14, padding: '28px', color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, opacity: 0.8, marginBottom: 8 }}>STUDENT PLAN</div>
          <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 4 }}>&#8377;199</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 20 }}>One-time payment &middot; Results in 90 seconds</div>
          <div style={{ textAlign: 'left', fontSize: 13, lineHeight: 2, marginBottom: 20 }}>
            &#10003; ATS resume (11 professional templates)<br/>
            &#10003; LinkedIn profile content (headline + about + experience)<br/>
            &#10003; 10-step LinkedIn account setup guide<br/>
            &#10003; 5 company interview preps (15 questions each)<br/>
            &#10003; HR cheat sheet + TMAY + project explanations<br/>
            &#10003; PDF + TXT download
          </div>
          <StudentPayButton formData={studentFormData} email={studentEmail} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 16, padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
            <strong>Student Pro — &#8377;349</strong><br/>
            10 company preps + 3 resume variants + cover letters
          </div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 12 }}>Need more? Upgrade to Standard (&#8377;300 more) anytime</div>
        </div>
      )}

      {/* ═══════════════════════════════════ */}
      {/* PROFILE INPUT FORM                  */}
      {/* ═══════════════════════════════════ */}
      {selectedPlan && (
        <section ref={inputFormRef} style={{ background: 'var(--bg-canvas)', padding: '28px 16px 40px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            {/* Plan switcher */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => setSelectedPlan('standard')}
                style={{
                  flex: '1 1 200px', maxWidth: 240, padding: '14px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: selectedPlan === 'standard' ? '2px solid var(--accent)' : '2px solid var(--border-default)',
                  background: selectedPlan === 'standard' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: selectedPlan === 'standard' ? 'var(--accent)' : 'var(--text-primary)' }}>&#8377;499</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: selectedPlan === 'standard' ? 'var(--accent)' : 'var(--text-secondary)' }}>Standard</div>
              </button>
              <button
                onClick={() => setSelectedPlan('pro')}
                style={{
                  flex: '1 1 200px', maxWidth: 240, padding: '14px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: selectedPlan === 'pro' ? '2px solid var(--accent)' : '2px solid var(--border-default)',
                  background: selectedPlan === 'pro' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: selectedPlan === 'pro' ? 'var(--accent)' : 'var(--text-primary)' }}>&#8377;999</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: selectedPlan === 'pro' ? 'var(--accent)' : 'var(--text-secondary)' }}>Pro</div>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 500px', minWidth: 0 }}>
                <ProfileInputForm
                  plan={selectedPlan}
                  teaserId={teaser?.teaser_id || null}
                  email={email}
                  initialRawPaste={currentRawPaste}
                  inputSource={inputSource}
                  targetRole={targetRole || qTargetRole}
                />
              </div>
              {/* Sidebar (desktop only) */}
              <div className="hidden lg:block" style={{ width: 280, flexShrink: 0, position: 'sticky', top: 80 }}>
                <div className="saas-card" style={{ padding: 20, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>What happens next</div>
                  {[
                    { num: '1', text: currentRawPaste ? 'Your data is loaded \u2014 review below' : 'Add your profile data' },
                    { num: '2', text: 'Pay securely via UPI/Card' },
                    { num: '3', text: 'AI rewrites your profile in ~90 seconds' },
                    { num: '4', text: inputSource === 'resume' ? 'Download improved resume + LinkedIn content' : 'Copy-paste your new profile + download resume' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.num}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--success-subtle)', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', padding: 16, fontSize: 12, color: 'var(--success)', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Secure &amp; Private</div>
                  Your data is processed by AI only. No humans read your profile. You can delete anytime.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Marketing stack — lazy-loaded below-fold content (only renders when no teaser) */}
      {!teaser && (
        <Suspense fallback={null}>
          <MarketingStack />
        </Suspense>
      )}

      {/* ═══════════════════════════════════ */}
      {/* FOOTER                              */}
      {/* ═══════════════════════════════════ */}
      <SiteFooter variant="dark" />
    </main>
  );
}
