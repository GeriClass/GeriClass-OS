import { Hono } from "hono";
import { authRoutes } from "./routes/auth";
import { usuariosRoutes } from "./routes/usuarios";
import { mentoresRoutes } from "./routes/mentores";
import { mentoradosRoutes } from "./routes/mentorados";
import { sessoesRoutes } from "./routes/sessoes";
import { tarefasPlanoRoutes } from "./routes/tarefas-plano";
import { exigirLogin, type Env, type Variaveis } from "./auth/middleware";
import { executarCron } from "./cron";

const app = new Hono<{ Bindings: Env; Variables: Variaveis }>();

const api = app
  .basePath("/api")
  .route("/auth", authRoutes)
  .use("/*", exigirLogin)
  .route("/usuarios", usuariosRoutes)
  .route("/mentores", mentoresRoutes)
  .route("/mentorados", mentoradosRoutes)
  .route("/sessoes", sessoesRoutes)
  .route("/tarefas-plano", tarefasPlanoRoutes);

export type AppType = typeof api;

export default {
  fetch: app.fetch,
  scheduled: executarCron,
} satisfies ExportedHandler<Env>;
