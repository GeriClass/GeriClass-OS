import { Hono } from "hono";
import { authRoutes } from "./routes/auth";
import { usuariosRoutes } from "./routes/usuarios";
import { mentoresRoutes } from "./routes/mentores";
import { mentoradosRoutes } from "./routes/mentorados";
import { sessoesRoutes } from "./routes/sessoes";
import { tarefasPlanoRoutes } from "./routes/tarefas-plano";
import { encontrosRoutes } from "./routes/encontros";
import { healthscoresRoutes } from "./routes/healthscores";
import { geriupdatesRoutes } from "./routes/geriupdates";
import { guAppRoutes } from "./routes/gu-app";
import { exigirLogin, type Env, type Variaveis } from "./auth/middleware";
import { executarCron } from "./cron";

const app = new Hono<{ Bindings: Env; Variables: Variaveis }>();

const api = app
  .basePath("/api")
  .route("/auth", authRoutes)
  .route("/gu", guAppRoutes) // app do assinante — auth própria, antes do exigirLogin
  .use("/*", exigirLogin)
  .route("/usuarios", usuariosRoutes)
  .route("/mentores", mentoresRoutes)
  .route("/mentorados", mentoradosRoutes)
  .route("/sessoes", sessoesRoutes)
  .route("/tarefas-plano", tarefasPlanoRoutes)
  .route("/encontros", encontrosRoutes)
  .route("/healthscores", healthscoresRoutes)
  .route("/geriupdates", geriupdatesRoutes);

export type AppType = typeof api;

export default {
  fetch: app.fetch,
  scheduled: executarCron,
} satisfies ExportedHandler<Env>;
