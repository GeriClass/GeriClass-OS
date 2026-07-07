# GeriClass OS

Sistema operacional interno da GeriClass — centraliza a operação da mentoria "Maestria de Consultório", CS & HealthScore, indicadores dos mentorados e gestão da empresa. Inclui também o **GeriUpdates**, o app do assinante (PWA em `/updates`).

**Stack:** Cloudflare Workers + Hono + D1 + Drizzle ORM + React (Vite) — tudo em um único Worker.

## Rodando localmente

```bash
npm install
npm run db:migrate:local   # aplica migrations no D1 local
npm run seed               # equipe + dados de exemplo
npm run dev                # Worker + D1 local + HMR em http://localhost:5173
```

Login de desenvolvimento: qualquer usuário do seed (ex.: `isabel@gericlass.com.br`) com a senha `gericlass2026`.

## Testes e typecheck

```bash
npm test     # vitest — regras de negócio (Bússola, HealthScore)
npm run check
```

## Deploy (Cloudflare)

1. Criar o banco (uma única vez): `npx wrangler d1 create gericlass_os` e copiar o `database_id` para `wrangler.jsonc`.
2. `npm run deploy` — build + migrations remotas + `wrangler deploy`.
3. Trocar as senhas do seed em produção (tela **Equipe**, papel admin).

## Estrutura

```
src/shared/    # constantes e schemas Zod compartilhados (PRAZO_BUSSOLA_DIAS, subgrupos…)
src/worker/    # API Hono: rotas, auth (sessão em D1), serviços de negócio, cron
src/web/       # SPA React: páginas, componentes, cliente HTTP
drizzle/       # migrations SQL geradas via `npm run db:generate`
scripts/       # seed.sql e (futuro) import das bases do Notion
test/          # vitest das regras de negócio
```

## GeriUpdates — app do assinante

O GeriUpdates (atualização diária em Geriatria) roda como **PWA mobile-first em `/updates`**, no mesmo Worker:

- **Assinante** (`/updates`): login próprio (independente da equipe), feed diário agrupado por dia, busca e filtros por tema/formato, leitura com markdown + vídeo/áudio embutidos, salvos, marcação automática de lido e troca de senha. Instalável na tela inicial (manifest + service worker com leitura offline do que já foi aberto).
- **Equipe** (tela **GeriUpdates** no painel): cria/edita conteúdos (artigo comentado, vídeo, áudio, material), publica na hora ou agenda, acompanha leituras e gerencia assinantes (convite com senha inicial, status ativo/pausado/cancelado).
- O status do conteúdo é **derivado** de `publicado_em` (NULL = rascunho, futuro = agendado) — ver `src/worker/services/geriupdates.ts`. Assinante só enxerga conteúdo publicado.
- Login de desenvolvimento do assinante: `assinante@example.com` / `gericlass2026` (seed).
- Ícones do PWA: `node scripts/gerar-icones.mjs` (regenera `public/icons/` a partir do SVG).

## Regras de negócio centrais

- **Bússola em 15 dias**: a 1ª Bússola de cada mentorado deve ocorrer em até 15 dias da `data_entrada`, com o mentor que captou. O prazo é derivado (nunca gravado) — ver `src/worker/services/bussola.ts` e a tela **Bússolas**.
- **Planos 30/60**: ao registrar uma sessão como realizada, os to-dos criados ganham `data_limite` = data da sessão + 30/60 dias. O CS cobra pela tela **Planos 30/60**.
- **HealthScore** (`src/worker/services/healthscore.ts`): presença em encontros + recência de sessão + execução de tarefas + indicadores do mês − dias sem contato. Verde ≥ 70, amarelo 40–69, vermelho < 40. "Sumido" também é derivado.

## Roadmap

- [x] Fase 0 — Scaffold, auth invite-only, equipe
- [x] Fase 1 — Mentorados, Sessões, tracker de Bússolas, Planos 30/60
- [x] Fase 2 — Painel CS (verde/amarelo/vermelho), Encontros + presença, lista de Sumidos, cron de snapshot
- [x] Import do Notion — mentorados (🧑) e sessões (🧭) reais, com `notion_url` de volta para cada página
- [x] GeriUpdates — app do assinante (PWA em `/updates`) + painel de publicação e assinantes
- [ ] Fase 3 — Indicadores mensais dos mentorados (matriz mês × mentorado)
- [ ] GeriUpdates v2 — notificações push do update do dia, import dos conteúdos históricos, assinatura/cobrança

- [ ] Fase 4 — Gestão & Metas (produtos, métricas mensais, metas com check-ins, reuniões e tarefas)
- [ ] Fase 5 — Import dos encontros (🎤) e presenças, portal do mentorado, integração Curseduca, notificações

## Import do Notion

Os scripts em `scripts/import-notion/` convertem exports das bases do Notion em SQL idempotente
(`INSERT ... ON CONFLICT DO UPDATE`, IDs derivados da URL do Notion):

```bash
node scripts/import-notion/gerar-sql.mjs           # mentorados  → data/import.sql
node scripts/import-notion/gerar-sql-sessoes.mjs   # sessões     → data/import-sessoes.sql
wrangler d1 execute gericlass_os --local --file=scripts/import-notion/data/import.sql
wrangler d1 execute gericlass_os --local --file=scripts/import-notion/data/import-sessoes.sql
```

Os dados crus ficam em `scripts/import-notion/data/` (**gitignored** — nunca commitar dados reais).
Cada arquivo `.mjs` documenta o formato esperado. Para produção, rodar os mesmos `.sql` com `--remote`.
