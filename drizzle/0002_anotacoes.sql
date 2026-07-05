CREATE TABLE `anotacoes` (
	`id` text PRIMARY KEY NOT NULL,
	`mentorado_id` text NOT NULL,
	`usuario_id` text,
	`tipo` text DEFAULT 'nota' NOT NULL,
	`texto` text NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`mentorado_id`) REFERENCES `mentorados`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
