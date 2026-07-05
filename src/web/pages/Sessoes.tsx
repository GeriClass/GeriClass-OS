import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Mentor, type Mentorado, type Sessao } from "../lib/api";
import { Botao, Campo, Card, inputCls, TituloPagina, Vazio } from "../components/ui";
import { TIPOS_SESSAO, TIPO_SESSAO_LABEL } from "@shared/constantes";

interface ItemSessao {
  sessao: Sessao;
  mentoradoNome: string;
  mentorNome: string | null;
}

export function Sessoes() {
  const queryClient = useQueryClient();
  const [criando, setCriando] = useState(false);
  const [registrando, setRegistrando] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["sessoes"], queryFn: () => api.get<{ sessoes: ItemSessao[] }>("/sessoes") });
  const { data: mentoradosData } = useQuery({
    queryKey: ["mentorados"],
    queryFn: () => api.get<{ mentorados: Mentorado[] }>("/mentorados"),
  });
  const { data: mentoresData } = useQuery({
    queryKey: ["mentores"],
    queryFn: () => api.get<{ mentores: Mentor[] }>("/mentores"),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["sessoes"] });
    queryClient.invalidateQueries({ queryKey: ["bussolas"] });
    queryClient.invalidateQueries({ queryKey: ["tarefas-plano"] });
  };

  const criar = useMutation({
    mutationFn: (dados: Record<string, unknown>) => api.post("/sessoes", dados),
    onSuccess: () => { invalidar(); setCriando(false); },
  });
  const registrar = useMutation({
    mutationFn: ({ id, ...dados }: { id: string } & Record<string, unknown>) => api.patch(`/sessoes/${id}`, dados),
    onSuccess: () => { invalidar(); setRegistrando(null); },
  });

  const agendadas = (data?.sessoes ?? []).filter((s) => s.sessao.status === "agendada");
  const passadas = (data?.sessoes ?? []).filter((s) => s.sessao.status !== "agendada");

  return (
    <div>
      <TituloPagina acao={<Botao onClick={() => setCriando(!criando)}>{criando ? "Cancelar" : "+ Nova sessão"}</Botao>}>
        Sessões
      </TituloPagina>

      {criando && (
        <Card className="mb-4">
          <FormSessao
            mentorados={mentoradosData?.mentorados ?? []}
            mentores={mentoresData?.mentores ?? []}
            enviando={criar.isPending}
            onSubmit={(dados) => criar.mutate(dados)}
          />
        </Card>
      )}

      <h2 className="mb-2 font-semibold text-slate-600">Agendadas ({agendadas.length})</h2>
      <Card className="mb-6">
        {agendadas.length === 0 ? (
          <Vazio>Nenhuma sessão agendada.</Vazio>
        ) : (
          <ul className="divide-y divide-slate-100">
            {agendadas.map((item) => (
              <li key={item.sessao.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium">{item.mentoradoNome}</span>
                    <span className="ml-2 rounded bg-gc-100 px-1.5 py-0.5 text-xs text-gc-700">
                      {TIPO_SESSAO_LABEL[item.sessao.tipo]}
                    </span>
                    <span className="ml-2 text-slate-500">{formatarDataHora(item.sessao.dataHora)}</span>
                    {item.mentorNome && <span className="ml-2 text-slate-400">com {item.mentorNome}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Botao variante="secundario" onClick={() => setRegistrando(registrando === item.sessao.id ? null : item.sessao.id)}>
                      Registrar realização
                    </Botao>
                    <Botao variante="secundario" onClick={() => registrar.mutate({ id: item.sessao.id, status: "cancelada" })}>
                      Cancelar
                    </Botao>
                  </div>
                </div>
                {registrando === item.sessao.id && (
                  <FormRegistrar
                    enviando={registrar.isPending}
                    onSubmit={(dados) => registrar.mutate({ id: item.sessao.id, status: "realizada", ...dados })}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <h2 className="mb-2 font-semibold text-slate-600">Histórico</h2>
      <Card>
        {passadas.length === 0 ? (
          <Vazio>Sem histórico ainda.</Vazio>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2">Mentorado</th><th>Tipo</th><th>Data</th><th>Mentor</th><th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {passadas.map((item) => (
                <tr key={item.sessao.id}>
                  <td className="py-2">
                    <Link to={`/mentorados/${item.sessao.mentoradoId}`} className="text-gc-700 hover:underline">
                      {item.mentoradoNome}
                    </Link>
                  </td>
                  <td>{TIPO_SESSAO_LABEL[item.sessao.tipo]}</td>
                  <td className="text-slate-500">{formatarDataHora(item.sessao.dataHora)}</td>
                  <td className="text-slate-500">{item.mentorNome ?? "—"}</td>
                  <td className="capitalize text-slate-500">{item.sessao.status.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function formatarDataHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function FormSessao({
  mentorados, mentores, enviando, onSubmit,
}: {
  mentorados: Mentorado[]; mentores: Mentor[]; enviando: boolean;
  onSubmit: (dados: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({ mentoradoId: "", mentorId: "", tipo: "bussola", dataHora: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, mentorId: form.mentorId || null, dataHora: new Date(form.dataHora).toISOString() });
      }}
      className="grid gap-3 md:grid-cols-4"
    >
      <Campo rotulo="Mentorado *">
        <select required value={form.mentoradoId} onChange={set("mentoradoId")} className={inputCls}>
          <option value="">Selecione…</option>
          {mentorados.filter((m) => m.status === "ativo").map((m) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Tipo">
        <select value={form.tipo} onChange={set("tipo")} className={inputCls}>
          {TIPOS_SESSAO.map((t) => (
            <option key={t} value={t}>{TIPO_SESSAO_LABEL[t]}</option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Data e hora *">
        <input required type="datetime-local" value={form.dataHora} onChange={set("dataHora")} className={inputCls} />
      </Campo>
      <Campo rotulo="Mentor">
        <select value={form.mentorId} onChange={set("mentorId")} className={inputCls}>
          <option value="">—</option>
          {mentores.map((m) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
      </Campo>
      <div className="md:col-span-4">
        <Botao type="submit" disabled={enviando}>{enviando ? "Salvando…" : "Agendar"}</Botao>
      </div>
    </form>
  );
}

function FormRegistrar({ enviando, onSubmit }: { enviando: boolean; onSubmit: (dados: Record<string, unknown>) => void }) {
  const [resumo, setResumo] = useState("");
  const [linkNotas, setLinkNotas] = useState("");
  const [tarefas, setTarefas] = useState<{ descricao: string; prazoTipo: 30 | 60 }[]>([{ descricao: "", prazoTipo: 30 }]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          resumo: resumo || undefined,
          linkNotas: linkNotas || undefined,
          novasTarefas: tarefas.filter((t) => t.descricao.trim()),
        });
      }}
      className="mt-3 space-y-3 rounded border border-slate-200 bg-slate-50 p-3"
    >
      <Campo rotulo="Resumo da sessão">
        <textarea value={resumo} onChange={(e) => setResumo(e.target.value)} rows={2} className={inputCls} />
      </Campo>
      <Campo rotulo="Link das notas (Notion/Zoom)">
        <input value={linkNotas} onChange={(e) => setLinkNotas(e.target.value)} className={inputCls} />
      </Campo>
      <div>
        <span className="mb-1 block text-sm font-medium text-slate-600">To-dos do plano (30/60 dias)</span>
        {tarefas.map((t, i) => (
          <div key={i} className="mb-1.5 flex gap-2">
            <input
              placeholder="Descrição da tarefa"
              value={t.descricao}
              onChange={(e) => setTarefas(tarefas.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)))}
              className={inputCls}
            />
            <select
              value={t.prazoTipo}
              onChange={(e) => setTarefas(tarefas.map((x, j) => (j === i ? { ...x, prazoTipo: Number(e.target.value) as 30 | 60 } : x)))}
              className={inputCls + " max-w-24"}
            >
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
            </select>
          </div>
        ))}
        <button type="button" onClick={() => setTarefas([...tarefas, { descricao: "", prazoTipo: 30 }])} className="text-sm text-gc-600 hover:underline">
          + adicionar tarefa
        </button>
      </div>
      <Botao type="submit" disabled={enviando}>{enviando ? "Registrando…" : "Concluir registro"}</Botao>
    </form>
  );
}
