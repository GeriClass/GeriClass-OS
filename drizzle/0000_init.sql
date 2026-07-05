CREATE TABLE `auth_sessoes` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `diagnosticos_entrada` (
	`id` text PRIMARY KEY NOT NULL,
	`mentorado_id` text NOT NULL,
	`data` text,
	`num_pacientes_mes` integer,
	`preco_consulta` real,
	`faturamento_estimado` real,
	`principais_dores` text,
	`respostas_extras` text,
	FOREIGN KEY (`mentorado_id`) REFERENCES `mentorados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `diagnosticos_entrada_mentorado_id_unique` ON `diagnosticos_entrada` (`mentorado_id`);--> statement-breakpoint
CREATE TABLE `encontros` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`subgrupo` text,
	`data_hora` text NOT NULL,
	`mentor_id` text,
	`tema` text,
	`link_gravacao` text,
	`notion_url` text,
	FOREIGN KEY (`mentor_id`) REFERENCES `mentores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `encontros_presencas` (
	`encontro_id` text NOT NULL,
	`mentorado_id` text NOT NULL,
	`presente` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`encontro_id`, `mentorado_id`),
	FOREIGN KEY (`encontro_id`) REFERENCES `encontros`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mentorado_id`) REFERENCES `mentorados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `healthscores` (
	`id` text PRIMARY KEY NOT NULL,
	`mentorado_id` text NOT NULL,
	`ano_mes` text NOT NULL,
	`score_calculado` integer NOT NULL,
	`componentes` text,
	`ajuste_manual` integer,
	`score_final` integer NOT NULL,
	`cor` text NOT NULL,
	`observacoes` text,
	`calculado_em` text NOT NULL,
	FOREIGN KEY (`mentorado_id`) REFERENCES `mentorados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `healthscores_mentorado_mes` ON `healthscores` (`mentorado_id`,`ano_mes`);--> statement-breakpoint
CREATE TABLE `indicadores_mensais` (
	`id` text PRIMARY KEY NOT NULL,
	`mentorado_id` text NOT NULL,
	`ano_mes` text NOT NULL,
	`num_pacientes` integer,
	`num_consultas` integer,
	`preco_medio_consulta` real,
	`faturamento` real,
	`pct_particular` real,
	`pct_convenio` real,
	`novos_pacientes` integer,
	`origem` text DEFAULT 'cs' NOT NULL,
	`preenchido_em` text NOT NULL,
	FOREIGN KEY (`mentorado_id`) REFERENCES `mentorados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `indicadores_mentorado_mes` ON `indicadores_mensais` (`mentorado_id`,`ano_mes`);--> statement-breakpoint
CREATE TABLE `mentorados` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text,
	`whatsapp` text,
	`cidade` text,
	`uf` text,
	`subgrupo` text DEFAULT 'semente' NOT NULL,
	`status` text DEFAULT 'ativo' NOT NULL,
	`mentor_recrutador_id` text,
	`data_entrada` text,
	`curseduca_id` text,
	`notion_url` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`mentor_recrutador_id`) REFERENCES `mentores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mentores` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text,
	`nome` text NOT NULL,
	`email` text,
	`ativo` integer DEFAULT true NOT NULL,
	`notion_url` text,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `metas` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text,
	`valor_alvo` real NOT NULL,
	`valor_atual` real DEFAULT 0 NOT NULL,
	`unidade` text,
	`data_limite` text,
	`produto_id` text,
	`responsavel_usuario_id` text,
	`status` text DEFAULT 'ativa' NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`responsavel_usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `metas_checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`meta_id` text NOT NULL,
	`data` text NOT NULL,
	`valor` real NOT NULL,
	`comentario` text,
	`usuario_id` text,
	FOREIGN KEY (`meta_id`) REFERENCES `metas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`plataforma` text,
	`ativo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `produtos_metricas_mensais` (
	`id` text PRIMARY KEY NOT NULL,
	`produto_id` text NOT NULL,
	`ano_mes` text NOT NULL,
	`alunos_ativos` integer,
	`alunos_inativos` integer,
	`novas_matriculas` integer,
	`cancelamentos` integer,
	`receita` real,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `produtos_metricas_produto_mes` ON `produtos_metricas_mensais` (`produto_id`,`ano_mes`);--> statement-breakpoint
CREATE TABLE `reunioes` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text DEFAULT 'gestao' NOT NULL,
	`titulo` text NOT NULL,
	`data` text NOT NULL,
	`participantes` text,
	`resumo` text,
	`notion_url` text
);
--> statement-breakpoint
CREATE TABLE `sessoes` (
	`id` text PRIMARY KEY NOT NULL,
	`mentorado_id` text NOT NULL,
	`mentor_id` text,
	`tipo` text NOT NULL,
	`data_hora` text NOT NULL,
	`status` text DEFAULT 'agendada' NOT NULL,
	`resumo` text,
	`link_notas` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`mentorado_id`) REFERENCES `mentorados`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mentor_id`) REFERENCES `mentores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tarefas` (
	`id` text PRIMARY KEY NOT NULL,
	`reuniao_id` text,
	`titulo` text NOT NULL,
	`descricao` text,
	`responsavel_usuario_id` text,
	`data_limite` text,
	`prioridade` text DEFAULT 'media' NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`concluida_em` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`reuniao_id`) REFERENCES `reunioes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`responsavel_usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tarefas_plano` (
	`id` text PRIMARY KEY NOT NULL,
	`sessao_id` text,
	`mentorado_id` text NOT NULL,
	`descricao` text NOT NULL,
	`prazo_tipo` integer DEFAULT 30 NOT NULL,
	`data_limite` text,
	`status` text DEFAULT 'pendente' NOT NULL,
	`concluida_em` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`sessao_id`) REFERENCES `sessoes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`mentorado_id`) REFERENCES `mentorados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`senha_hash` text NOT NULL,
	`papel` text DEFAULT 'equipe' NOT NULL,
	`cargo` text,
	`data_inicio` text,
	`ativo` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);