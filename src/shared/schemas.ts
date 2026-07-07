import { z } from "zod";
import {
  PAPEIS,
  STATUS_ASSINANTE,
  STATUS_MENTORADO,
  STATUS_SESSAO,
  STATUS_TAREFA,
  SUBGRUPOS,
  TIPOS_CONTEUDO_GU,
  TIPOS_SESSAO,
} from "./constantes";

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const usuarioCreateSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(8),
  papel: z.enum(PAPEIS).default("equipe"),
  cargo: z.string().optional(),
  dataInicio: z.string().optional(),
});

export const usuarioUpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  papel: z.enum(PAPEIS).optional(),
  cargo: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(8).optional(),
});

export const mentoradoCreateSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  subgrupo: z.enum(SUBGRUPOS).default("semente"),
  status: z.enum(STATUS_MENTORADO).default("ativo"),
  turma: z.string().optional(),
  mentorRecrutadorId: z.string().nullable().optional(),
  dataEntrada: z.string().optional(), // ISO date
  curseducaId: z.string().optional(),
  notionUrl: z.string().optional(),
});

export const mentoradoUpdateSchema = mentoradoCreateSchema.partial();

export const sessaoCreateSchema = z.object({
  mentoradoId: z.string().min(1),
  mentorId: z.string().nullable().optional(),
  tipo: z.enum(TIPOS_SESSAO),
  dataHora: z.string().min(1), // ISO datetime
  status: z.enum(STATUS_SESSAO).default("agendada"),
  resumo: z.string().optional(),
  linkNotas: z.string().optional(),
});

export const sessaoUpdateSchema = z.object({
  mentorId: z.string().nullable().optional(),
  tipo: z.enum(TIPOS_SESSAO).optional(),
  dataHora: z.string().optional(),
  status: z.enum(STATUS_SESSAO).optional(),
  resumo: z.string().nullable().optional(),
  linkNotas: z.string().nullable().optional(),
  /** To-dos de 30/60 dias criados junto ao registrar a sessão como realizada. */
  novasTarefas: z
    .array(
      z.object({
        descricao: z.string().min(1),
        prazoTipo: z.union([z.literal(30), z.literal(60)]).default(30),
      }),
    )
    .optional(),
});

export const tarefaPlanoUpdateSchema = z.object({
  descricao: z.string().min(1).optional(),
  status: z.enum(STATUS_TAREFA).optional(),
  dataLimite: z.string().nullable().optional(),
});

export const anotacaoCreateSchema = z.object({
  tipo: z.enum(["contato", "nota"]).default("nota"),
  texto: z.string().min(1),
});

export const encontroCreateSchema = z.object({
  titulo: z.string().min(1),
  subgrupo: z.enum(SUBGRUPOS).nullable().optional(), // null = todos
  dataHora: z.string().min(1),
  mentorId: z.string().nullable().optional(),
  tema: z.string().optional(),
  linkGravacao: z.string().optional(),
  notionUrl: z.string().optional(),
});

export const presencasSchema = z.object({
  presencas: z.array(z.object({ mentoradoId: z.string().min(1), presente: z.boolean() })),
});

// ─── GeriUpdates ─────────────────────────────────────────────────────────────

export const guConteudoCreateSchema = z.object({
  titulo: z.string().min(1),
  resumo: z.string().optional(),
  corpo: z.string().min(1),
  tipo: z.enum(TIPOS_CONTEUDO_GU).default("artigo"),
  tema: z.string().optional(),
  linkReferencia: z.string().optional(),
  linkVideo: z.string().optional(),
  linkAudio: z.string().optional(),
  /** ISO datetime; omitir = rascunho, futuro = agendado. */
  publicadoEm: z.string().nullable().optional(),
});

export const guConteudoUpdateSchema = guConteudoCreateSchema.partial().extend({
  resumo: z.string().nullable().optional(),
  tema: z.string().nullable().optional(),
  linkReferencia: z.string().nullable().optional(),
  linkVideo: z.string().nullable().optional(),
  linkAudio: z.string().nullable().optional(),
});

export const guAssinanteCreateSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(8),
  whatsapp: z.string().optional(),
  status: z.enum(STATUS_ASSINANTE).default("ativo"),
  curseducaId: z.string().optional(),
});

export const guAssinanteUpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  whatsapp: z.string().nullable().optional(),
  status: z.enum(STATUS_ASSINANTE).optional(),
  curseducaId: z.string().nullable().optional(),
  senha: z.string().min(8).optional(),
});

export const guAlterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(8),
});

export const guMarcarSchema = z.object({ valor: z.boolean() });

export const mentorCreateSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  usuarioId: z.string().nullable().optional(),
});
