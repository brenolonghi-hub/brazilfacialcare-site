// Serves the static site and receives the form submissions.
// Each submission is saved in D1 and, when configured, announced by email.

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  NOTIFY?: SendEmail;
  NOTIFY_FROM?: string;
  NOTIFY_TO?: string;
}

// Accepted forms and the thank-you page each one returns to.
const FORMS: Record<string, string> = {
  'pre-cadastro-profissional': '/pt/obrigado/',
  'waitlist-en': '/en/thank-you/',
  'waitlist-es': '/es/gracias/',
};

const CONSENT_FIELDS = ['consentimento_lgpd', 'consent', 'consentimiento'];
const MAX_FIELD_LENGTH = 2000;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/submit') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
      return handleSubmit(request, env, ctx, url);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleSubmit(request: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response('Invalid form', { status: 400 });
  }

  const formName = String(form.get('form-name') ?? '');
  const thanks = FORMS[formName];
  if (!thanks) return new Response('Unknown form', { status: 400 });

  // Bots fill the hidden field; pretend it worked and store nothing.
  if (String(form.get('hp_field') ?? '') !== '') return redirect(url, thanks);

  if (!CONSENT_FIELDS.some((f) => form.get(f))) return new Response('Consent is required', { status: 400 });

  const data: Record<string, string | string[]> = {};
  for (const key of new Set(form.keys())) {
    if (key === 'form-name' || key === 'hp_field') continue;
    const values = form.getAll(key).map((v) => String(v).slice(0, MAX_FIELD_LENGTH));
    data[key] = values.length > 1 ? values : values[0];
  }

  await env.DB.prepare('INSERT INTO submissions (form, created_at, data) VALUES (?, ?, ?)')
    .bind(formName, new Date().toISOString(), JSON.stringify(data))
    .run();

  if (env.NOTIFY && env.NOTIFY_FROM && env.NOTIFY_TO) {
    ctx.waitUntil(notify(env, formName, data).catch((err) => console.error('notify failed', err)));
  }

  return redirect(url, thanks);
}

function redirect(url: URL, path: string): Response {
  return Response.redirect(new URL(path, url.origin).toString(), 303);
}

async function notify(env: Env, formName: string, data: Record<string, string | string[]>): Promise<void> {
  const { EmailMessage } = await import('cloudflare:email');
  const body = Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');
  const subject = `Novo envio no site: ${formName}`;
  const raw = [
    `From: Brazil Facial Care <${env.NOTIFY_FROM}>`,
    `To: <${env.NOTIFY_TO}>`,
    `Subject: =?UTF-8?B?${base64(subject)}?=`,
    `Message-ID: <${crypto.randomUUID()}@${env.NOTIFY_FROM!.split('@')[1]}>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64(body).replace(/.{76}/g, '$&\r\n'),
  ].join('\r\n');
  await env.NOTIFY!.send(new EmailMessage(env.NOTIFY_FROM!, env.NOTIFY_TO!, raw));
}

function base64(text: string): string {
  let bin = '';
  for (const byte of new TextEncoder().encode(text)) bin += String.fromCharCode(byte);
  return btoa(bin);
}
