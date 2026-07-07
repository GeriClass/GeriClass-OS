-- Seed inicial do GeriClass OS (dev local).
-- Senha temporária de todos os usuários: gericlass2026 (trocar no primeiro acesso em produção).

INSERT OR IGNORE INTO usuarios (id, nome, email, senha_hash, papel, cargo, ativo, created_at) VALUES
  ('usr_daniel',  'Daniel Gomes',      'daniel@gericlass.com.br',  'pbkdf2$100000$NCIn10XGqKqDd1AjaySq3w==$PDKK3FfI3D1oRuN3K60DMIM/172R8759a29rhoXZKbw=', 'admin',  'Fundador / Mentor', 1, '2026-01-01T00:00:00Z'),
  ('usr_gericlass', 'GeriClass Admin', 'gericlass@gericlass.com.br','pbkdf2$100000$NCIn10XGqKqDd1AjaySq3w==$PDKK3FfI3D1oRuN3K60DMIM/172R8759a29rhoXZKbw=', 'admin',  'Administração', 1, '2026-01-01T00:00:00Z'),
  ('usr_rafael',  'Rafael Duncan',     'rafael@gericlass.com.br',  'pbkdf2$100000$NCIn10XGqKqDd1AjaySq3w==$PDKK3FfI3D1oRuN3K60DMIM/172R8759a29rhoXZKbw=', 'mentor', 'Mentor', 1, '2026-01-01T00:00:00Z'),
  ('usr_louise',  'Louise Montesanti', 'louise@gericlass.com.br',  'pbkdf2$100000$NCIn10XGqKqDd1AjaySq3w==$PDKK3FfI3D1oRuN3K60DMIM/172R8759a29rhoXZKbw=', 'mentor', 'Mentora', 1, '2026-01-01T00:00:00Z'),
  ('usr_isabel',  'Isabel Caminha',    'isabel@gericlass.com.br',  'pbkdf2$100000$NCIn10XGqKqDd1AjaySq3w==$PDKK3FfI3D1oRuN3K60DMIM/172R8759a29rhoXZKbw=', 'cs',     'Customer Success', 1, '2026-01-01T00:00:00Z');

INSERT OR IGNORE INTO mentores (id, usuario_id, nome, email, ativo) VALUES
  ('mtr_daniel', 'usr_daniel', 'Daniel Gomes',      'daniel@gericlass.com.br', 1),
  ('mtr_rafael', 'usr_rafael', 'Rafael Duncan',     'rafael@gericlass.com.br', 1),
  ('mtr_louise', 'usr_louise', 'Louise Montesanti', 'louise@gericlass.com.br', 1),
  ('mtr_isabel', 'usr_isabel', 'Isabel Caminha',    'isabel@gericlass.com.br', 1);

-- Mentorados de exemplo (dev): um com Bússola vencida, um vencendo, um realizado.
INSERT OR IGNORE INTO mentorados (id, nome, email, subgrupo, status, mentor_recrutador_id, data_entrada, created_at) VALUES
  ('mto_exemplo1', 'Exemplo — Bússola Vencida',  'ex1@example.com', 'semente', 'ativo', 'mtr_daniel', date('now', '-25 days'), datetime('now')),
  ('mto_exemplo2', 'Exemplo — Bússola Vencendo', 'ex2@example.com', 'semente', 'ativo', 'mtr_rafael', date('now', '-12 days'), datetime('now')),
  ('mto_exemplo3', 'Exemplo — Em Dia',           'ex3@example.com', 'broto',   'ativo', 'mtr_daniel', date('now', '-40 days'), datetime('now'));

INSERT OR IGNORE INTO sessoes (id, mentorado_id, mentor_id, tipo, data_hora, status, resumo, created_at) VALUES
  ('ses_exemplo1', 'mto_exemplo3', 'mtr_daniel', 'bussola', datetime('now', '-30 days'), 'realizada', 'Bússola inicial: foco em precificação e agenda.', datetime('now'));

INSERT OR IGNORE INTO tarefas_plano (id, sessao_id, mentorado_id, descricao, prazo_tipo, data_limite, status, created_at) VALUES
  ('tar_exemplo1', 'ses_exemplo1', 'mto_exemplo3', 'Definir novo preço de consulta', 30, date('now', '-1 days'), 'pendente', datetime('now')),
  ('tar_exemplo2', 'ses_exemplo1', 'mto_exemplo3', 'Contratar secretária', 60, date('now', '+29 days'), 'pendente', datetime('now'));

-- GeriUpdates (dev): assinante de exemplo (senha gericlass2026) + conteúdos.
INSERT OR IGNORE INTO gu_assinantes (id, nome, email, senha_hash, whatsapp, status, created_at) VALUES
  ('gua_exemplo1', 'Assinante Exemplo', 'assinante@example.com', 'pbkdf2$100000$NCIn10XGqKqDd1AjaySq3w==$PDKK3FfI3D1oRuN3K60DMIM/172R8759a29rhoXZKbw=', '11999990000', 'ativo', datetime('now'));

INSERT OR IGNORE INTO gu_conteudos (id, titulo, resumo, corpo, tipo, tema, link_referencia, publicado_em, autor_usuario_id, created_at, updated_at) VALUES
  ('guc_exemplo1', 'Rastreio de fragilidade no consultório: o que muda em 2026',
   'Novo consenso propõe triagem em duas etapas — veja como aplicar na prática.',
   'O consenso publicado esta semana propõe **triagem em duas etapas** para fragilidade:' || char(10) || char(10) || '- FRAIL scale na recepção (autoaplicável)' || char(10) || '- Confirmação com fenótipo de Fried apenas nos positivos' || char(10) || char(10) || '## Na prática' || char(10) || 'Comece pelos pacientes com 75+ anos e polifarmácia. O ganho está em priorizar quem se beneficia de intervenção precoce.',
   'artigo', 'Fragilidade', 'https://example.com/artigo-fragilidade', datetime('now'), 'usr_daniel', datetime('now'), datetime('now')),
  ('guc_exemplo2', 'Desprescrição de benzodiazepínicos: protocolo em 4 passos',
   'Resumo prático do ensaio randomizado sobre retirada gradual em idosos.',
   'O ensaio avaliou retirada gradual com **redução de 25% a cada 2 semanas**:' || char(10) || char(10) || '1. Identificar dose equivalente de diazepam' || char(10) || '2. Reduzir 25% a cada 14 dias' || char(10) || '3. Pausar a redução se sintomas de retirada' || char(10) || '4. Suporte não farmacológico para insônia' || char(10) || char(10) || '> 62% dos pacientes completaram a retirada sem recaída em 6 meses.',
   'artigo', 'Polifarmácia', 'https://example.com/artigo-bzd', datetime('now', '-1 days'), 'usr_daniel', datetime('now'), datetime('now')),
  ('guc_exemplo3', 'Vídeo: como conduzir a conversa sobre diretivas antecipadas',
   'Daniel comenta os 3 erros mais comuns e o roteiro que usamos no consultório.',
   'Neste vídeo comento o roteiro de conversa sobre **diretivas antecipadas de vontade**, com os erros que mais vejo na prática e como contorná-los.',
   'video', 'Cuidados Paliativos', NULL, datetime('now', '-2 days'), 'usr_daniel', datetime('now'), datetime('now')),
  ('guc_exemplo4', 'Sarcopenia: rascunho do update de amanhã',
   NULL,
   'Rascunho em construção — não visível para assinantes.',
   'artigo', 'Sarcopenia', NULL, NULL, 'usr_daniel', datetime('now'), datetime('now'));

UPDATE gu_conteudos SET link_video = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' WHERE id = 'guc_exemplo3';
