import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { to, firstName, lastName, email, password, appointmentDate, doctorName } = body;

  // In production, configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Bienvenue au Centre Médical SEVEN</title></head>
<body style="font-family: Arial, sans-serif; background:#f9fafb; padding:32px; color:#111;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:#065f46;padding:28px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Centre Médical Spécialisé SEVEN</h1>
      <p style="color:#a7f3d0;margin:4px 0 0;font-size:14px;">Gériatrie &amp; Gérontologie — Abidjan</p>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:20px;margin-bottom:8px;">Bienvenue, ${firstName} ${lastName} !</h2>
      <p style="color:#374151;">Votre demande de rendez-vous a été <strong style="color:#065f46;">confirmée</strong>. Votre espace patient est maintenant créé.</p>

      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 12px;font-weight:600;">Vos identifiants de connexion :</p>
        <p style="margin:4px 0;font-size:15px;">📧 <strong>Email :</strong> ${email}</p>
        <p style="margin:4px 0;font-size:15px;">🔑 <strong>Mot de passe :</strong> <code style="background:#dcfce7;padding:2px 8px;border-radius:6px;font-size:16px;">${password}</code></p>
      </div>

      ${appointmentDate ? `
      <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-weight:600;">Votre rendez-vous :</p>
        <p style="margin:4px 0;">📅 <strong>${new Date(appointmentDate).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</strong></p>
        ${doctorName ? `<p style="margin:4px 0;">👨‍⚕️ <strong>${doctorName}</strong></p>` : ''}
      </div>` : ''}

      <p style="color:#374151;">Connectez-vous sur notre portail :</p>
      <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/login"
         style="display:inline-block;background:#065f46;color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:600;margin:8px 0 24px;">
        Accéder à mon espace →
      </a>

      <p style="color:#6b7280;font-size:13px;">Pour toute question, appelez-nous au <strong>+225 27 22 40 00 00</strong>.</p>
    </div>
    <div style="background:#f3f4f6;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Centre Médical Spécialisé SEVEN — Cocody Angré, Abidjan</p>
    </div>
  </div>
</body>
</html>`;

  if (!smtpHost || !smtpUser || !smtpPass) {
    // No SMTP configured — log and return success (demo mode)
    console.log('[send-email] SMTP not configured. Would send to:', to);
    console.log('[send-email] Password:', password);
    return NextResponse.json({ success: true, demo: true });
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"Centre Médical SEVEN" <${smtpUser}>`,
      to,
      subject: 'Bienvenue — Votre espace patient est prêt',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[send-email] error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
