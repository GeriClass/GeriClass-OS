import { sqliteTable, text, integer, real, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";

// ─── Pessoas e acesso ────────────────────────────────────────────────────────

export const usuarios = sqliteTable("usuarios", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  papel: text("papel", { enum: ["admin", "mentor", "cs", "equipe"] }).notNull().default("equipe"),
  cargo: text("cargo"),
  dataInicio: text("data_inicio"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const authSessoes = sqliteTable("auth_sessoes", {
  id: text("id").primaryKey(),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
});

export const mentores = sqliteTable("mentores", {
  id: text("id").primaryKey(),
  usuarioId: text("usuario_id").references(() => usuarios.id),
  nome: text("nome").notNull(),
  email: text("email"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  notionUrl: text("notion_url"),
});

// ─── Mentoria ────────────────────────────────────────────────────────────────

export const mentorados = sqliteTable("mentorados", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email"),
  whatsapp: text("whatsapp"),
  cidade: text("cidade"),
  uf: text("uf"),
  subgrupo: text("subgrupo", { enum: ["semente", "broto", "arvore", "frutos"] }).notNull().default("semente"),
  status: text("status", { enum: ["ativo", "pausado", "encerrado"] }).notNull().default("ativo"),
  turma: text("turma"),
  mentorRecrutadorId: text("mentor_recrutador_id").references(() => mentores.id),
  dataEntrada: text("data_entrada"),
  curseducaId: text("curseduca_id"),
  notionUrl: text("notion_url"),
  createdAt: text("created_at").notNull(),
});

export const diagnosticosEntrada = sqliteTable("diagnosticos_entrada", {
  id: text("id").primaryKey(),
  mentoradoId: text("mentorado_id").notNull().unique().references(() => mentorados.id, { onDelete: "cascade" }),
  data: text("data"),
  numPacientesMes: integer("num_pacientes_mes"),
  precoConsulta: real("preco_consulta"),
  faturamentoEstimado: real("faturamento_estimado"),
  principaisDores: text("principais_dores"),
  respostasExtras: text("respostas_extras"), // JSON
});

export const sessoes = sqliteTable("sessoes", {
  id: text("id").primaryKey(),
  mentoradoId: text("mentorado_id").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  mentorId: text("mentor_id").references(() => mentores.id),
  tipo: text("tipo", { enum: ["onboarding", "bussola", "acompanhamento"] }).notNull(),
  dataHora: text("data_hora").notNull(),
  status: text("status", { enum: ["agendada", "realizada", "cancelada", "no_show"] }).notNull().default("agendada"),
  resumo: text("resumo"),
  linkNotas: text("link_notas"),
  createdAt: text("created_at").notNull(),
});

export const tarefasPlano = sqliteTable("tarefas_plano", {
  id: text("id").primaryKey(),
  sessaoId: text("sessao_id").references(() => sessoes.id, { onDelete: "set null" }),
  mentoradoId: text("mentorado_id").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  descricao: text("descricao").notNull(),
  prazoTipo: integer("prazo_tipo").notNull().default(30), // 30 | 60
  dataLimite: text("data_limite"),
  status: text("status", { enum: ["pendente", "em_andamento", "concluida", "abandonada"] }).notNull().default("pendente"),
  concluidaEm: text("concluida_em"),
  createdAt: text("created_at").notNull(),
});

export const encontros = sqliteTable("encontros", {
  id: text("id").primaryKey(),
  titulo: text("titulo").notNull(),
  subgrupo: text("subgrupo", { enum: ["semente", "broto", "arvore", "frutos"] }), // NULL = todos
  dataHora: text("data_hora").notNull(),
  mentorId: text("mentor_id").references(() => mentores.id),
  tema: text("tema"),
  linkGravacao: text("link_gravacao"),
  notionUrl: text("notion_url"),
});

export const encontrosPresencas = sqliteTable(
  "encontros_presencas",
  {
    encontroId: text("encontro_id").notNull().references(() => encontros.id, { onDelete: "cascade" }),
    mentoradoId: text("mentorado_id").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
    presente: integer("presente", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.encontroId, t.mentoradoId] })],
);

// Anotações do CS sobre o mentorado. tipo='contato' conta como interação
// (tira o mentorado da lista de sumidos e alimenta o HealthScore).
export const anotacoes = sqliteTable("anotacoes", {
  id: text("id").primaryKey(),
  mentoradoId: text("mentorado_id").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
  usuarioId: text("usuario_id").references(() => usuarios.id),
  tipo: text("tipo", { enum: ["contato", "nota"] }).notNull().default("nota"),
  texto: text("texto").notNull(),
  data: text("data").notNull(),
});

// ─── Saúde do mentorado ──────────────────────────────────────────────────────

export const healthscores = sqliteTable(
  "healthscores",
  {
    id: text("id").primaryKey(),
    mentoradoId: text("mentorado_id").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
    anoMes: text("ano_mes").notNull(), // '2026-07'
    scoreCalculado: integer("score_calculado").notNull(),
    componentes: text("componentes"), // JSON {presenca, sessoes, tarefas, indicadores, dias_sem_contato}
    ajusteManual: integer("ajuste_manual"),
    scoreFinal: integer("score_final").notNull(),
    cor: text("cor", { enum: ["verde", "amarelo", "vermelho"] }).notNull(),
    observacoes: text("observacoes"),
    calculadoEm: text("calculado_em").notNull(),
  },
  (t) => [uniqueIndex("healthscores_mentorado_mes").on(t.mentoradoId, t.anoMes)],
);

export const indicadoresMensais = sqliteTable(
  "indicadores_mensais",
  {
    id: text("id").primaryKey(),
    mentoradoId: text("mentorado_id").notNull().references(() => mentorados.id, { onDelete: "cascade" }),
    anoMes: text("ano_mes").notNull(),
    numPacientes: integer("num_pacientes"),
    numConsultas: integer("num_consultas"),
    precoMedioConsulta: real("preco_medio_consulta"),
    faturamento: real("faturamento"),
    pctParticular: real("pct_particular"),
    pctConvenio: real("pct_convenio"),
    novosPacientes: integer("novos_pacientes"),
    origem: text("origem", { enum: ["cs", "mentorado"] }).notNull().default("cs"),
    preenchidoEm: text("preenchido_em").notNull(),
  },
  (t) => [uniqueIndex("indicadores_mentorado_mes").on(t.mentoradoId, t.anoMes)],
);

// ─── GeriUpdates (app do assinante) ──────────────────────────────────────────

export const guAssinantes = sqliteTable("gu_assinantes", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  whatsapp: text("whatsapp"),
  status: text("status", { enum: ["ativo", "pausado", "cancelado"] }).notNull().default("ativo"),
  curseducaId: text("curseduca_id"),
  ultimoAcessoEm: text("ultimo_acesso_em"),
  createdAt: text("created_at").notNull(),
});

export const guAssinanteSessoes = sqliteTable("gu_assinante_sessoes", {
  id: text("id").primaryKey(),
  assinanteId: text("assinante_id").notNull().references(() => guAssinantes.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
});

// Conteúdo diário do GeriUpdates. Status é derivado de publicado_em
// (NULL = rascunho, futuro = agendado, passado = publicado) — nunca gravado.
export const guConteudos = sqliteTable("gu_conteudos", {
  id: text("id").primaryKey(),
  titulo: text("titulo").notNull(),
  resumo: text("resumo"),
  corpo: text("corpo").notNull(), // markdown
  tipo: text("tipo", { enum: ["artigo", "video", "audio", "material"] }).notNull().default("artigo"),
  tema: text("tema"),
  linkReferencia: text("link_referencia"),
  linkVideo: text("link_video"),
  linkAudio: text("link_audio"),
  publicadoEm: text("publicado_em"),
  autorUsuarioId: text("autor_usuario_id").references(() => usuarios.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const guLeituras = sqliteTable(
  "gu_leituras",
  {
    conteudoId: text("conteudo_id").notNull().references(() => guConteudos.id, { onDelete: "cascade" }),
    assinanteId: text("assinante_id").notNull().references(() => guAssinantes.id, { onDelete: "cascade" }),
    lidoEm: text("lido_em").notNull(),
  },
  (t) => [primaryKey({ columns: [t.conteudoId, t.assinanteId] })],
);

export const guSalvos = sqliteTable(
  "gu_salvos",
  {
    conteudoId: text("conteudo_id").notNull().references(() => guConteudos.id, { onDelete: "cascade" }),
    assinanteId: text("assinante_id").notNull().references(() => guAssinantes.id, { onDelete: "cascade" }),
    salvoEm: text("salvo_em").notNull(),
  },
  (t) => [primaryKey({ columns: [t.conteudoId, t.assinanteId] })],
);

// ─── Gestão da empresa ───────────────────────────────────────────────────────

export const produtos = sqliteTable("produtos", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo", { enum: ["curso", "mentoria", "app", "evento"] }).notNull(),
  plataforma: text("plataforma"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
});

export const produtosMetricasMensais = sqliteTable(
  "produtos_metricas_mensais",
  {
    id: text("id").primaryKey(),
    produtoId: text("produto_id").notNull().references(() => produtos.id, { onDelete: "cascade" }),
    anoMes: text("ano_mes").notNull(),
    alunosAtivos: integer("alunos_ativos"),
    alunosInativos: integer("alunos_inativos"),
    novasMatriculas: integer("novas_matriculas"),
    cancelamentos: integer("cancelamentos"),
    receita: real("receita"),
  },
  (t) => [uniqueIndex("produtos_metricas_produto_mes").on(t.produtoId, t.anoMes)],
);

export const metas = sqliteTable("metas", {
  id: text("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  valorAlvo: real("valor_alvo").notNull(),
  valorAtual: real("valor_atual").notNull().default(0),
  unidade: text("unidade"),
  dataLimite: text("data_limite"),
  produtoId: text("produto_id").references(() => produtos.id),
  responsavelUsuarioId: text("responsavel_usuario_id").references(() => usuarios.id),
  status: text("status", { enum: ["ativa", "concluida", "cancelada"] }).notNull().default("ativa"),
});

export const metasCheckins = sqliteTable("metas_checkins", {
  id: text("id").primaryKey(),
  metaId: text("meta_id").notNull().references(() => metas.id, { onDelete: "cascade" }),
  data: text("data").notNull(),
  valor: real("valor").notNull(),
  comentario: text("comentario"),
  usuarioId: text("usuario_id").references(() => usuarios.id),
});

export const reunioes = sqliteTable("reunioes", {
  id: text("id").primaryKey(),
  tipo: text("tipo", { enum: ["gestao", "cs", "outra"] }).notNull().default("gestao"),
  titulo: text("titulo").notNull(),
  data: text("data").notNull(),
  participantes: text("participantes"), // JSON array de nomes
  resumo: text("resumo"),
  notionUrl: text("notion_url"),
});

export const tarefas = sqliteTable("tarefas", {
  id: text("id").primaryKey(),
  reuniaoId: text("reuniao_id").references(() => reunioes.id, { onDelete: "set null" }),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  responsavelUsuarioId: text("responsavel_usuario_id").references(() => usuarios.id),
  dataLimite: text("data_limite"),
  prioridade: text("prioridade", { enum: ["alta", "media", "baixa"] }).notNull().default("media"),
  status: text("status", { enum: ["pendente", "em_andamento", "concluida"] }).notNull().default("pendente"),
  concluidaEm: text("concluida_em"),
  createdAt: text("created_at").notNull(),
});
