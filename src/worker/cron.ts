import type { Env } from "./auth/middleware";

/**
 * Crons (wrangler.jsonc):
 *  - "0 12 * * 1": segunda 09:00 America/Recife — lista de sumidos (Fase 2)
 *  - "0 6 1 * *": dia 1 do mês — recálculo do HealthScore (Fase 2)
 *
 * Na Fase 1 os handlers só registram o disparo; a materialização chega com o
 * módulo CS & HealthScore.
 */
export async function executarCron(event: ScheduledController, _env: Env): Promise<void> {
  console.log(`[cron] disparo ${event.cron} em ${new Date(event.scheduledTime).toISOString()}`);
}
