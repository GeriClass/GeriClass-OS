import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Mentor } from "../lib/api";
import { Botao, Campo, Card, inputCls, SubgrupoBadge, TituloPagina, Vazio } from "../components/ui";
import { SUBGRUPOS, SUBGRUPO_LABEL, type Subgrupo } from "@shared/constantes";

interface Encontro {
  id: string;
  titulo: string;
  subgrupo: Subgrupo | null;
  dataHora: string;
  mentorId: string | null;
  tema: string | null;
  linkGravacao: string | null;
  numPresentes: number;
}

interface Participante {
  id: string;
  nome: string;
  subgrupo: Subgrupo;
  presente: boolean;
}

export function Encontros() {
  const queryClient = useQueryClient();
  const [criando, setCriando] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["encontros"],
    queryFn: () => api.get<{ encontros: Encontro[] }>("/encontros"),
  });
  const { data: mentoresData } = useQuery({
    queryKey: ["mentores"],
    queryFn: () => api.get<{ mentores: Mentor[] }>("/mentores"),
  });

  const criar = useMutation({
    mutationFn: (dados: Record<string, unknown>) => api.post("/encontros", dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encontros"] });
      setCriando(false);
    },
  });

  return (
    <div>
      <TituloPagina acao={<Botao onClick={() => setCriando(!criando)}>{criando ? "Cancelar" : "+ Novo encontro"}</Botao>}>
        🎤 Encontros
      </TituloPagina>

      {criando && (
        <Card className="mb-4">
          <FormEncontro mentores={mentoresData?.mentores ?? []} enviando={criar.isPending} onSubmit={(d) => criar.mutate(d)} />
        </Card>
      )}

      <Card>
        {!data?.encontros.length ? (
          <Vazio>Nenhum encontro registrado.</Vazio>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.encontros.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium">{e.titulo}</span>
                    <span className="ml-2 text-slate-400">{new Date(e.dataHora).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="ml-2">
                      {e.subgrupo ? <SubgrupoBadge subgrupo={e.subgrupo} /> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">Todos</span>}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">{e.numPresentes} presentes</span>
                  </div>
                  <Botao variante="secundario" onClick={() => setAberto(aberto === e.id ? null : e.id)}>
                    {aberto === e.id ? "Fechar presença" : "Presença"}
                  </Botao>
                </div>
                {aberto === e.id && <ChecklistPresenca encontroId={e.id} />}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ChecklistPresenca({ encontroId }: { encontroId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["encontro", encontroId],
    queryFn: () => api.get<{ participantes: Participante[] }>(`/encontros/${encontroId}`),
  });

  const salvar = useMutation({
    mutationFn: (presencas: { mentoradoId: string; presente: boolean }[]) =>
      api.put(`/encontros/${encontroId}/presencas`, { presencas }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encontro", encontroId] });
      queryClient.invalidateQueries({ queryKey: ["encontros"] });
      queryClient.invalidateQueries({ queryKey: ["painel-cs"] });
    },
  });

  if (isLoading) return <p className="mt-2 text-sm text-slate-400">Carregando participantes…</p>;
  const participantes = data?.participantes ?? [];

  return (
    <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3">
      {participantes.length === 0 ? (
        <Vazio>Nenhum mentorado elegível.</Vazio>
      ) : (
        <div className="grid gap-1.5 text-sm md:grid-cols-2 lg:grid-cols-3">
          {participantes.map((p) => (
            <label key={p.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={p.presente}
                onChange={(ev) => salvar.mutate([{ mentoradoId: p.id, presente: ev.target.checked }])}
                className="accent-gc-600"
              />
              <span>{p.nome}</span>
              <SubgrupoBadge subgrupo={p.subgrupo} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function FormEncontro({
  mentores, enviando, onSubmit,
}: { mentores: Mentor[]; enviando: boolean; onSubmit: (d: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ titulo: "", subgrupo: "", dataHora: "", mentorId: "", tema: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...form,
          subgrupo: form.subgrupo || null,
          mentorId: form.mentorId || null,
          tema: form.tema || undefined,
          dataHora: new Date(form.dataHora).toISOString(),
        });
      }}
      className="grid gap-3 md:grid-cols-5"
    >
      <Campo rotulo="Título *"><input required value={form.titulo} onChange={set("titulo")} className={inputCls} /></Campo>
      <Campo rotulo="Subgrupo">
        <select value={form.subgrupo} onChange={set("subgrupo")} className={inputCls}>
          <option value="">Todos</option>
          {SUBGRUPOS.map((s) => (
            <option key={s} value={s}>{SUBGRUPO_LABEL[s]}</option>
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
      <Campo rotulo="Tema"><input value={form.tema} onChange={set("tema")} className={inputCls} /></Campo>
      <div className="md:col-span-5">
        <Botao type="submit" disabled={enviando}>{enviando ? "Salvando…" : "Criar encontro"}</Botao>
      </div>
    </form>
  );
}
