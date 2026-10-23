# Brazil Facial Care: site (fase 1)

Site trilíngue (português, inglês, espanhol) feito com [Astro](https://astro.build) e publicado como Cloudflare Worker com arquivos estáticos.

- `/pt/`: página para dentistas e médicos, com formulário de pré-cadastro.
- `/en/` e `/es/`: página "em breve" para pacientes, com lista de espera.
- O nome da marca e o e-mail ficam em `src/config.ts`.
- `worker/index.ts` recebe os formulários em `/api/submit`, grava no banco D1 e manda um aviso por e-mail.

## Rodar localmente

    npm install
    npm run build
    npx wrangler d1 migrations apply brazilfacialcare --local
    npx wrangler dev

## Configuração na Cloudflare (uma vez)

1. **Email Routing** do domínio ativado, com o seu e-mail pessoal verificado como destino.
2. **Banco D1** chamado `brazilfacialcare`. Copie o id para `database_id` no `wrangler.jsonc` e rode a migração em `migrations/` (pelo console do D1 ou `wrangler d1 migrations apply brazilfacialcare --remote`).
3. Em `wrangler.jsonc`, preencha `NOTIFY_TO` com o e-mail verificado que vai receber os avisos.
4. **Workers & Pages > Create > Import a repository**: escolha o repositório, comando de build `npm run build`, comando de deploy `npx wrangler deploy`.
5. No Worker, em **Domains & Routes**, adicione `brazilfacialcare.com` e `www.brazilfacialcare.com`.

## Ver os envios

Painel da Cloudflare > D1 > brazilfacialcare > Console: `SELECT * FROM submissions ORDER BY id DESC;`
