CREATE TABLE `gu_assinante_sessoes` (
	`id` text PRIMARY KEY NOT NULL,
	`assinante_id` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`assinante_id`) REFERENCES `gu_assinantes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gu_assinantes` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`senha_hash` text NOT NULL,
	`whatsapp` text,
	`status` text DEFAULT 'ativo' NOT NULL,
	`curseduca_id` text,
	`ultimo_acesso_em` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gu_assinantes_email_unique` ON `gu_assinantes` (`email`);--> statement-breakpoint
CREATE TABLE `gu_conteudos` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`resumo` text,
	`corpo` text NOT NULL,
	`tipo` text DEFAULT 'artigo' NOT NULL,
	`tema` text,
	`link_referencia` text,
	`link_video` text,
	`link_audio` text,
	`publicado_em` text,
	`autor_usuario_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`autor_usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `gu_leituras` (
	`conteudo_id` text NOT NULL,
	`assinante_id` text NOT NULL,
	`lido_em` text NOT NULL,
	PRIMARY KEY(`conteudo_id`, `assinante_id`),
	FOREIGN KEY (`conteudo_id`) REFERENCES `gu_conteudos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assinante_id`) REFERENCES `gu_assinantes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gu_salvos` (
	`conteudo_id` text NOT NULL,
	`assinante_id` text NOT NULL,
	`salvo_em` text NOT NULL,
	PRIMARY KEY(`conteudo_id`, `assinante_id`),
	FOREIGN KEY (`conteudo_id`) REFERENCES `gu_conteudos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assinante_id`) REFERENCES `gu_assinantes`(`id`) ON UPDATE no action ON DELETE cascade
);
