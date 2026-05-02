import * as React from 'react';
import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from '@react-email/components';

interface Props {
  email: string;
  plan: 'standard' | 'pro' | 'starter' | 'plus' | 'student' | 'student_pro';
  orderId: string;
  resumeUrl?: string;
}

const PLAN_PRICE: Record<string, number> = {
  standard: 499, pro: 999, starter: 199, plus: 399, student: 99, student_pro: 199,
};
const PLAN_LABEL: Record<string, string> = {
  standard: 'Standard', pro: 'Pro', starter: 'Starter', plus: 'Plus', student: 'Student', student_pro: 'Student Pro',
};

export default function AbandonedCartEmail({ email, plan, orderId, resumeUrl }: Props) {
  const price = PLAN_PRICE[plan] ?? 499;
  const label = PLAN_LABEL[plan] ?? 'Standard';
  const checkoutUrl = `https://profileroaster.in/?orderId=${orderId}&plan=${plan}&recover=1`;

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={hero}>
            <Heading style={h1}>You&rsquo;re one click away from a better resume.</Heading>
            <Text style={lead}>
              We noticed you started checkout but didn&rsquo;t finish. Your profile data is saved &mdash; complete your purchase below to get your AI-rewritten resume in 90 seconds.
            </Text>
            <Button href={resumeUrl || checkoutUrl} style={ctaButton}>
              Complete checkout — &#8377;{price}
            </Button>
            <Text style={{ ...muted, marginTop: 16 }}>
              Plan: <strong>{label}</strong> &nbsp;&middot;&nbsp; All taxes included &nbsp;&middot;&nbsp; One-time payment
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={included}>
            <Text style={includedTitle}>What you&rsquo;ll get:</Text>
            <Text style={includedItem}>&#10003; AI rewrite of your headline, about, and experience</Text>
            <Text style={includedItem}>&#10003; ATS-optimized resume in 11 templates</Text>
            <Text style={includedItem}>&#10003; Personalized cover letter</Text>
            <Text style={includedItem}>&#10003; Interview prep with 15 STAR-format questions</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Sent to {email} &middot; If you didn&rsquo;t start a checkout, you can safely ignore this email.
          </Text>
          <Text style={footer}>
            ProfileRoaster &middot; <a href="https://profileroaster.in" style={footerLink}>profileroaster.in</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = { backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0 };
const container: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '40px 16px' };
const hero: React.CSSProperties = { background: '#FFFFFF', borderRadius: '16px', padding: '32px 28px', textAlign: 'center' };
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 700, color: '#0A0A0A', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.25 };
const lead: React.CSSProperties = { fontSize: '14px', color: '#525252', lineHeight: 1.6, margin: '0 0 20px' };
const ctaButton: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
  color: '#FFFFFF',
  padding: '12px 28px',
  borderRadius: '12px',
  fontSize: '14px',
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-block',
};
const muted: React.CSSProperties = { fontSize: '12px', color: '#737373', margin: '0' };
const hr: React.CSSProperties = { border: 'none', borderTop: '1px solid #E5E7EB', margin: '24px 0' };
const included: React.CSSProperties = { padding: '0 4px' };
const includedTitle: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' };
const includedItem: React.CSSProperties = { fontSize: '13px', color: '#374151', margin: '6px 0', lineHeight: 1.5 };
const footer: React.CSSProperties = { fontSize: '11px', color: '#A3A3A3', textAlign: 'center', margin: '6px 0' };
const footerLink: React.CSSProperties = { color: '#4F46E5', textDecoration: 'none' };
