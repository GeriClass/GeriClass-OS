import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  api,
  type Mentor,
  type Mentorado,
  type Sessao,
  type TarefaPlano,
  type SituacaoBussola,
  type HealthScore,
} from "../lib/api";
import { Botao, Campo, Card, HealthBadge, inputCls, SubgrupoBadge, TituloPagina, Vazio, WhatsAppLink } from "../components/ui";
import { SUBGRUPOS, SUBGRUPO_LABEL, TIPO_SESSAO_LABEL } from "@shared/constantes";

interface Anotacao {
  anotacao: { id: string; tipo: "contato" | "nota"; texto: string; data: string };
  usuarioNome: string | null;
}

interface Detalhe {
  mentorado: Mentorado;
  sessoes: Sessao[];
  tarefas: TarefaPlano[];
  diagnostico: Record<string, unknown> | null;
  healthscores: (HealthScore & { anoMes: string })[];
  anotacoes: Anotacao[];
  bussola: SituacaoBussola;
}

const ROTULO_BUSSOLA: Record<SituacaoBussola["situacao"], { texto: string; cls: string }> = {
  realizada: { texto: "Bússola realizada ✓", cls: "text-emerald-600" },
  agendada: { texto: "Bússola agendada", cls: "text-sky-600" },
  no_prazo: { texto: "Bússola pendente (no prazo)", cls: "text-slate-600" },
  vencendo: { texto: "Bússola vencendo!", cls: "text-amber-600 font-semibold" },
  vencida: { texto: "Bússola VENCIDA", cls: "text-red-600 font-semibold" },
  sem_data_entrada: { texto: "Sem data de entrada cadastrada", cls: "text-slate-400" },
};

export function MentoradoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["mentorado", id],
    queryFn: () => api.get<Detalhe>(`/mentorados/${id}`),
  });
  const { data: mentoresData } = useQuery({
    queryKey: ["mentores"],
    queryFn: () => api.get<{ mentores: Mentor[] }>("/mentores"),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["mentorado", id] });
    queryClient.invalidateQueries({ queryKey: ["mentorados"] });
    queryClient.invalidateQueries({ queryKey: ["sumidos"] });
    queryClient.invalidateQueries({ queryKey: ["painel-cs"] });
    queryClient.invalidateQueries({ queryKey: ["bussolas"] });
  };

  const salvar = useMutation({
    mutationFn: (dados: Record<string, unknown>) => api.patch(`/mentorados/${id}`, dados),
    onSuccess: () => {
      invalidar();
      setEditando(false);
    },
  });
  const alternarTarefa = useMutation({
    mutationFn: ({ tarefaId, status }: { tarefaId: string; status: string }) =>
      api.patch(`/tarefas-plano/${tarefaId}`, { status }),
    onSuccess: invalidar,
  });
  const anotar = useMutation({
    mutationFn: (dados: { tipo: string; texto: string }) => api.post(`/mentorados/${id}/anotacoes`, dados),
    onSuccess: invalidar,
  });

  if (isLoading) return <p className="text-slate-400">Carregando…</p>;
  if (!data) return <Vazio>Mentorado não encontrado.</Vazio>;

  const { mentorado: m, sessoes, tarefas, bussola, healthscores, anotacoes } = data;
  const ultimoScore = healthscores[healthscores.length - 1];
  const rotulo = ROTULO_BUSSOLA[bussola.situacao];
  const nomeMentor = (mid: string | null) => mentoresData?.mentores.find((x) => x.id === mid)?.nome ?? "—";

  return (
    <div>
      <TituloPagina>
        {m.nome}{" "}
        <span className="ml-2 align-middle"><SubgrupoBadge subgrupo={m.subgrupo} /></span>
        {m.turma && <span className="ml-2 align-middle rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{m.turma}</span>}
        {ultimoScore && (
          <span className="ml-3 align-middle"><HealthBadge cor={ultimoScore.cor} score={ultimoScore.scoreFinal} /></span>
        )}
      </TituloPagina>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Dados</h2>
            <Botao variante="secundario" onClick={() => setEditando(!editando)}>
              {editando ? "Cancelar" : "✏️ Editar"}
            </Botao>
          </div>
          {editando ? (
            <FormEditar
              mentorado={m}
              mentores={mentoresData?.mentores ?? []}
              enviando={salvar.isPending}
              onSubmit={(dados) => salvar.mutate(dados)}
            />
          ) : (
            <>
              <dl className="space-y-1 text-sm">
                <Linha rotulo="Email" valor={m.email?.toLowerCase() ?? null} semCapitalize />
                <div className="flex justify-between">
                  <dt className="text-slate-400">WhatsApp</dt>
                  <dd>{m.whatsapp ? <>{m.whatsapp} · <WhatsAppLink numero={m.whatsapp} /></> : "—"}</dd>
                </div>
                <Linha rotulo="Cidade" valor={m.cidade ? `${m.cidade}${m.uf ? "/" + m.uf : ""}` : null} />
                <Linha rotulo="Entrada" valor={m.dataEntrada} />
                <Linha rotulo="Mentor que captou" valor={nomeMentor(m.mentorRecrutadorId)} />
                <Linha rotulo="Status" valor={m.status} />
              </dl>
              <p className={`mt-3 text-sm ${rotulo.cls}`}>
                {rotulo.texto}
                {bussola.diasRestantes !== null && bussola.situacao !== "realizada" && (
                  <span>
                    {" "}— {bussola.diasRestantes < 0 ? `${-bussola.diasRestantes} dias vencida` : `${bussola.diasRestantes} dias restantes`} (limite {bussola.dataLimite})
                  </span>
                )}
              </p>
              {m.notionUrl && (
                <a href={m.notionUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-gc-600 hover:underline">
                  Página no Notion →
                </a>
              )}
            </>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Sessões <span className="text-xs font-normal text-slate-400">({sessoes.length})</span></h2>
          {sessoes.length === 0 ? (
            <Vazio>Nenhuma sessão registrada.</Vazio>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto text-sm">
              {sessoes.map((s) => (
                <li key={s.id} className="py-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{TIPO_SESSAO_LABEL[s.tipo]}</span>
                    <span className="text-slate-400">{s.dataHora.slice(0, 10)}</span>
                  </div>
                  <div className="text-xs capitalize text-slate-500">{s.status.replace("_", " ")}</div>
                  {s.resumo && <p className="mt-1 text-xs text-slate-600">{s.resumo}</p>}
                  {s.linkNotas && (
                    <a href={s.linkNotas} target="_blank" rel="noreferrer" className="text-xs text-gc-600 hover:underline">
                      Notas →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link to="/sessoes" className="mt-2 inline-block text-sm text-gc-600 hover:underline">Agendar sessão →</Link>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Plano 30/60 dias</h2>
          {tarefas.length === 0 ? (
            <Vazio>Sem tarefas de plano.</Vazio>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {tarefas.map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={t.status === "concluida"}
                    onChange={() =>
                      alternarTarefa.mutate({ tarefaId: t.id, status: t.status === "concluida" ? "pendente" : "concluida" })
                    }
                    className="mt-0.5 accent-gc-600"
                  />
                  <span className={t.status === "concluida" ? "text-slate-400 line-through" : ""}>
                    {t.descricao}
                    {t.dataLimite && <span className="ml-1 text-xs text-slate-400">({t.prazoTipo}d · até {t.dataLimite})</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <h2 className="mb-2 font-semibold">📝 Anotações e contatos</h2>
          <FormAnotacao enviando={anotar.isPending} onSubmit={(dados) => anotar.mutate(dados)} />
          {anotacoes.length === 0 ? (
            <Vazio>Nenhuma anotação ainda. Registrar um contato tira o mentorado da lista de sumidos.</Vazio>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {anotacoes.map(({ anotacao: a, usuarioNome }) => (
                <li key={a.id} className="flex items-start gap-3 py-2">
                  <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${a.tipo === "contato" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {a.tipo === "contato" ? "📞 contato" : "📝 nota"}
                  </span>
                  <div className="flex-1">
                    <p>{a.texto}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(a.data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      {usuarioNome ? ` · ${usuarioNome}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor, semCapitalize }: { rotulo: string; valor: string | null; semCapitalize?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400">{rotulo}</dt>
      <dd className={semCapitalize ? "" : "capitalize"}>{valor ?? "—"}</dd>
    </div>
  );
}

function FormEditar({
  mentorado,
  mentores,
  enviando,
  onSubmit,
}: {
  mentorado: Mentorado;
  mentores: Mentor[];
  enviando: boolean;
  onSubmit: (dados: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    nome: mentorado.nome,
    email: mentorado.email ?? "",
    whatsapp: mentorado.whatsapp ?? "",
    cidade: mentorado.cidade ?? "",
    uf: mentorado.uf ?? "",
    subgrupo: mentorado.subgrupo,
    status: mentorado.status,
    turma: mentorado.turma ?? "",
    dataEntrada: mentorado.dataEntrada ?? "",
    mentorRecrutadorId: mentorado.mentorRecrutadorId ?? "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, mentorRecrutadorId: form.mentorRecrutadorId || null });
      }}
      className="space-y-2"
    >
      <Campo rotulo="Nome"><input required value={form.nome} onChange={set("nome")} className={inputCls} /></Campo>
      <Campo rotulo="Email"><input type="email" value={form.email} onChange={set("email")} className={inputCls} /></Campo>
      <Campo rotulo="WhatsApp"><input value={form.whatsapp} onChange={set("whatsapp")} className={inputCls} /></Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo rotulo="Cidade"><input value={form.cidade} onChange={set("cidade")} className={inputCls} /></Campo>
        <Campo rotulo="UF"><input maxLength={2} value={form.uf} onChange={set("uf")} className={inputCls} /></Campo>
        <Campo rotulo="Subgrupo">
          <select value={form.subgrupo} onChange={set("subgrupo")} className={inputCls}>
            {SUBGRUPOS.map((s) => (
              <option key={s} value={s}>{SUBGRUPO_LABEL[s]}</option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Status">
          <select value={form.status} onChange={set("status")} className={inputCls}>
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </Campo>
        <Campo rotulo="Turma"><input value={form.turma} onChange={set("turma")} className={inputCls} /></Campo>
        <Campo rotulo="Entrada"><input type="date" value={form.dataEntrada} onChange={set("dataEntrada")} className={inputCls} /></Campo>
      </div>
      <Campo rotulo="Mentor que captou">
        <select value={form.mentorRecrutadorId} onChange={set("mentorRecrutadorId")} className={inputCls}>
          <option value="">—</option>
          {mentores.map((x) => (
            <option key={x.id} value={x.id}>{x.nome}</option>
          ))}
        </select>
      </Campo>
      <Botao type="submit" disabled={enviando}>{enviando ? "Salvando…" : "Salvar alterações"}</Botao>
    </form>
  );
}

function FormAnotacao({ enviando, onSubmit }: { enviando: boolean; onSubmit: (d: { tipo: string; texto: string }) => void }) {
  const [tipo, setTipo] = useState("contato");
  const [texto, setTexto] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!texto.trim()) return;
        onSubmit({ tipo, texto: texto.trim() });
        setTexto("");
      }}
      className="flex flex-wrap gap-2"
    >
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls + " max-w-32"}>
        <option value="contato">📞 Contato</option>
        <option value="nota">📝 Nota</option>
      </select>
      <input
        placeholder={tipo === "contato" ? "Ex.: falei no WhatsApp, vai voltar aos encontros…" : "Anotação livre sobre o mentorado…"}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className={inputCls + " flex-1 min-w-64"}
      />
      <Botao type="submit" disabled={enviando || !texto.trim()}>Registrar</Botao>
    </form>
  );
}
