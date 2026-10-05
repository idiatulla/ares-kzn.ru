// Cloudflare Pages Function: POST /api/contact
// Sends the contact form to the office mailbox through the Resend API.
//
// Environment variables (Pages -> Settings -> Variables and Secrets):
//   RESEND_API_KEY  (secret)  Resend API key
//   MAIL_TO                   recipient(s), comma separated, e.g. areskzn@mail.ru
//   MAIL_FROM                 sender on a domain verified in Resend,
//                             e.g. "Сайт АРЕС <noreply@ares-kzn.ru>"

const MAX = { name: 200, phone: 50, email: 200, message: 5000 };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'Некорректный запрос' }, 400);
  }

  // Honeypot: real users never fill this field. Pretend success for bots.
  if (data.website) return json({ ok: true });

  const clean = {};
  for (const key of Object.keys(MAX)) {
    clean[key] = String(data[key] ?? '').trim().slice(0, MAX[key]);
  }

  if (!clean.name || !clean.message) {
    return json({ ok: false, error: 'Заполните имя и текст вопроса' }, 400);
  }
  if (!clean.phone && !clean.email) {
    return json({ ok: false, error: 'Укажите телефон или e-mail' }, 400);
  }
  if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
    return json({ ok: false, error: 'Некорректный адрес электронной почты' }, 400);
  }

  if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) {
    console.error('Mail is not configured: RESEND_API_KEY / MAIL_TO / MAIL_FROM');
    return json({ ok: false, error: 'Почтовый сервис не настроен' }, 500);
  }

  const page = String(data.page ?? '').slice(0, 200);
  const rows = [
    ['Имя', clean.name],
    ['Телефон', clean.phone || '—'],
    ['E-mail', clean.email || '—'],
    ['Страница', page || '—'],
  ];
  const html =
    '<table cellpadding="6" style="border-collapse:collapse">' +
    rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('') +
    '</table>' +
    `<p style="white-space:pre-wrap">${esc(clean.message)}</p>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${clean.message}`;

  const payload = {
    from: env.MAIL_FROM,
    to: env.MAIL_TO.split(',').map((s) => s.trim()).filter(Boolean),
    subject: `Заявка с сайта ares-kzn.ru: ${clean.name}`,
    html,
    text,
  };
  if (clean.email) payload.reply_to = clean.email;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return json({ ok: false, error: 'Не удалось отправить сообщение' }, 502);
  }
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'Method not allowed' }, 405);
