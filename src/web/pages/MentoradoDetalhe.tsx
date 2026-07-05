import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api, type Mentorado, type Sessao, type TarefaPlano, type SituacaoBussola, type HealthScore } from "../lib/api";
import { Card, HealthBadge, SubgrupoBadge, TituloPagina, Vazio } from "../components/ui";
import { TIPO_SESSAO_LABEL } from "@shared/constantes";

interface Detalhe {
  mentorado: Mentorado;
  sessoes: Sessao[];
  tarefas: TarefaPlano[];
  diagnostico: Record<string, unknown> | null;
  healthscores: (HealthScore & { anoMes: string })[];
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
  const { data, isLoading } = useQuery({
    queryKey: ["mentorado", id],
    queryFn: () => api.get<Detalhe>(`/mentorados/${id}`),
  });

  const alternarTarefa = useMutation({
    mutationFn: ({ tarefaId, status }: { tarefaId: string; status: string }) =>
      api.patch(`/tarefas-plano/${tarefaId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentorado", id] }),
  });

  if (isLoading) return <p className="text-slate-400">Carregando…</p>;
  if (!data) return <Vazio>Mentorado não encontrado.</Vazio>;

  const { mentorado: m, sessoes, tarefas, bussola, healthscores } = data;
  const ultimoScore = healthscores[healthscores.length - 1];
  const rotulo = ROTULO_BUSSOLA[bussola.situacao];

  return (
    <div>
      <TituloPagina>
        {m.nome}{" "}
        <span className="ml-2 align-middle"><SubgrupoBadge subgrupo={m.subgrupo} /></span>
        {ultimoScore && (
          <span className="ml-3 align-middle"><HealthBadge cor={ultimoScore.cor} score={ultimoScore.scoreFinal} /></span>
        )}
      </TituloPagina>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-2 font-semibold">Dados</h2>
          <dl className="space-y-1 text-sm">
            <Linha rotulo="Email" valor={m.email} />
            <Linha rotulo="WhatsApp" valor={m.whatsapp} />
            <Linha rotulo="Cidade" valor={m.cidade ? `${m.cidade}${m.uf ? "/" + m.uf : ""}` : null} />
            <Linha rotulo="Entrada" valor={m.dataEntrada} />
            <Linha rotulo="Status" valor={m.status} />
          </dl>
          <p className={`mt-3 text-sm ${rotulo.cls}`}>
            {rotulo.texto}
            {bussola.diasRestantes !== null && bussola.situacao !== "realizada" && (
              <span> — {bussola.diasRestantes < 0 ? `${-bussola.diasRestantes} dias vencida` : `${bussola.diasRestantes} dias restantes`} (limite {bussola.dataLimite})</span>
            )}
          </p>
          {m.notionUrl && (
            <a href={m.notionUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-gc-600 hover:underline">
              Página no Notion →
            </a>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Sessões</h2>
          {sessoes.length === 0 ? (
            <Vazio>Nenhuma sessão registrada.</Vazio>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
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
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400">{rotulo}</dt>
      <dd className="capitalize">{valor ?? "—"}</dd>
    </div>
  );
}
