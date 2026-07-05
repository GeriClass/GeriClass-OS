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
