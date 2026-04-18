import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/confirm-appointment
 *
 * Creates a real patient account in Supabase Auth and sends credentials by email.
 * Falls back to nodemailer (SMTP) when Supabase is not configured.
 *
 * Body: { email, firstName, lastName, password, appointmentDate?, doctorName? }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, firstName, lastName, password, appointmentDate, doctorName } = body;

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'email and password are required' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (supabaseAdmin) {
    // ── Supabase path ────────────────────────────────────────────
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const exists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!exists) {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto-confirm so they can login immediately
        user_metadata: { firstName, lastName, role: 'patient' },
      });

      if (error) {
        console.error('[confirm-appointment] Supabase createUser error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    } else {
      // Update password for existing user
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const user = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (user) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
      }
    }

    // Send email via Supabase's built-in SMTP OR our custom route
    await sendWelcomeEmail({ email, firstName, lastName, password, appointmentDate, doctorName });

    return NextResponse.json({ success: true, provider: 'supabase' });
  }

  // ── Fallback: nodemailer-only path ────────────────────────────
  // Account is managed by the in-memory db (handled by the caller).
  // We just send the email here.
  await sendWelcomeEmail({ email, firstName, lastName, password, appointmentDate, doctorName });
  return NextResponse.json({ success: true, provider: 'mock' });
}

// ── Email helper ───────────────────────────────────────────────
async function sendWelcomeEmail(opts: {
  email: string; firstName: string; lastName: string;
  password: string; appointmentDate?: string; doctorName?: string;
}) {
  const { email, firstName, lastName, password, appointmentDate, doctorName } = opts;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>Bienvenue au Centre Médical SEVEN</title></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:32px;color:#111;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
  <div style="background:#059669;padding:28px 32px;">
    <h1 style="color:#fff;margin:0;font-size:22px;">Centre Médical Spécialisé SEVEN</h1>
    <p style="color:#a7f3d0;margin:4px 0 0;font-size:14px;">Gériatrie &amp; Gérontologie — Abidjan</p>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:20px;margin-bottom:8px;">Bienvenue, ${firstName} ${lastName} !</h2>
    <p style="color:#374151;">Votre rendez-vous a été <strong style="color:#059669;">confirmé</strong>. Votre espace patient est prêt.</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 12px;font-weight:600;">Vos identifiants de connexion :</p>
      <p style="margin:4px 0;">📧 <strong>Email :</strong> ${email}</p>
      <p style="margin:4px 0;">🔑 <strong>Mot de passe :</strong>
        <code style="background:#dcfce7;padding:4px 10px;border-radius:6px;font-size:16px;font-weight:bold;">${password}</code>
      </p>
    </div>
    ${appointmentDate ? `
    <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-weight:600;">Votre rendez-vous :</p>
      <p style="margin:4px 0;">📅 <strong>${new Date(appointmentDate).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</strong></p>
      ${doctorName ? `<p style="margin:4px 0;">👨‍⚕️ ${doctorName}</p>` : ''}
    </div>` : ''}
    <a href="${appUrl}/login"
       style="display:inline-block;background:#059669;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;margin:8px 0 24px;">
      Accéder à mon espace →
    </a>
    <p style="color:#6b7280;font-size:13px;">Besoin d'aide ? Appelez-nous au <strong>+225 27 22 40 00 00</strong>.</p>
  </div>
  <div style="background:#f3f4f6;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Centre Médical SEVEN — Cocody Angré, Abidjan</p>
  </div>
</div>
</body>
</html>`;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('\n[EMAIL] ─────────────────────────────────────');
    console.log('[EMAIL] To:', email);
    console.log('[EMAIL] Patient:', `${firstName} ${lastName}`);
    console.log('[EMAIL] Password:', password);
    console.log('[EMAIL] SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS to send real emails.');
    console.log('[EMAIL] ─────────────────────────────────────\n');
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transport.sendMail({
      from: `"Centre Médical SEVEN" <${smtpUser}>`,
      to: email,
      subject: '✅ Rendez-vous confirmé — Votre espace patient SEVEN',
      html,
    });
    console.log('[EMAIL] Sent to', email);
  } catch (err: any) {
    console.error('[EMAIL] Send failed:', err.message);
  }
}
