import { criarDb } from "./db";
import { materializarHealthscores } from "./routes/healthscores";
import type { Env } from "./auth/middleware";

/**
 * Crons (wrangler.jsonc):
 *  - "0 12 * * 1": segunda 09:00 America/Recife — snapshot semanal do healthscore
 *    (a lista de sumidos em si é derivada e sempre atual em /api/healthscores/sumidos)
 *  - "0 6 1 * *": dia 1 do mês — materializa o healthscore do mês que começa
 */
export async function executarCron(event: ScheduledController, env: Env): Promise<void> {
  const db = criarDb(env.DB);
  const total = await materializarHealthscores(db, new Date(event.scheduledTime));
  console.log(`[cron ${event.cron}] healthscore materializado para ${total} mentorados`);
}
