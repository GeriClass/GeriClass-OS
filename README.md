# GeriClass OS

Sistema operacional interno da GeriClass — centraliza a operação da mentoria "Maestria de Consultório", CS & HealthScore, indicadores dos mentorados e gestão da empresa.

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

## Regras de negócio centrais

- **Bússola em 15 dias**: a 1ª Bússola de cada mentorado deve ocorrer em até 15 dias da `data_entrada`, com o mentor que captou. O prazo é derivado (nunca gravado) — ver `src/worker/services/bussola.ts` e a tela **Bússolas**.
- **Planos 30/60**: ao registrar uma sessão como realizada, os to-dos criados ganham `data_limite` = data da sessão + 30/60 dias. O CS cobra pela tela **Planos 30/60**.
- **HealthScore** (`src/worker/services/healthscore.ts`): presença em encontros + recência de sessão + execução de tarefas + indicadores do mês − dias sem contato. Verde ≥ 70, amarelo 40–69, vermelho < 40. "Sumido" também é derivado.

## Roadmap

- [x] Fase 0 — Scaffold, auth invite-only, equipe
- [x] Fase 1 — Mentorados, Sessões, tracker de Bússolas, Planos 30/60
- [ ] Fase 2 — Painel CS (verde/amarelo/vermelho), Encontros + presença, lista de sumidos (cron de segunda)
- [ ] Fase 3 — Indicadores mensais dos mentorados (matriz mês × mentorado)
- [ ] Fase 4 — Gestão & Metas (produtos, métricas mensais, metas com check-ins, reuniões e tarefas)
- [ ] Fase 5 — Import das bases do Notion, portal do mentorado, integração Curseduca, notificações
