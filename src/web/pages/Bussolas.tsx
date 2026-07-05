import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Mentorado, type Sessao, type SituacaoBussola } from "../lib/api";
import { Card, SubgrupoBadge, TituloPagina, Vazio } from "../components/ui";

interface Item {
  mentorado: Mentorado;
  bussola: Sessao | null;
  situacao: SituacaoBussola;
}

const ESTILO: Record<SituacaoBussola["situacao"], { rotulo: string; cls: string }> = {
  vencida: { rotulo: "Vencida", cls: "bg-red-100 text-red-700" },
  vencendo: { rotulo: "Vencendo", cls: "bg-amber-100 text-amber-700" },
  sem_data_entrada: { rotulo: "Sem data de entrada", cls: "bg-slate-100 text-slate-500" },
  no_prazo: { rotulo: "No prazo", cls: "bg-sky-100 text-sky-700" },
  agendada: { rotulo: "Agendada", cls: "bg-indigo-100 text-indigo-700" },
  realizada: { rotulo: "Realizada ✓", cls: "bg-emerald-100 text-emerald-700" },
};

export function Bussolas() {
  const { data } = useQuery({
    queryKey: ["bussolas"],
    queryFn: () => api.get<{ bussolas: Item[] }>("/mentorados/bussolas"),
  });

  const itens = data?.bussolas ?? [];
  const pendentes = itens.filter((i) => i.situacao.situacao !== "realizada");

  return (
    <div>
      <TituloPagina>
        🧭 Tracker de Bússolas{" "}
        <span className="text-sm font-normal text-slate-400">({pendentes.length} pendentes)</span>
      </TituloPagina>
      <p className="mb-4 text-sm text-slate-500">
        A 1ª Bússola deve acontecer em até <strong>15 dias</strong> da entrada, com o mentor que captou.
      </p>
      <Card>
        {itens.length === 0 ? (
          <Vazio>Nenhum mentorado ativo.</Vazio>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2">Mentorado</th>
                <th>Subgrupo</th>
                <th>Entrada</th>
                <th>Limite (15d)</th>
                <th>Dias</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itens.map(({ mentorado: m, situacao }) => {
                const estilo = ESTILO[situacao.situacao];
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2">
                      <Link to={`/mentorados/${m.id}`} className="font-medium text-gc-700 hover:underline">
                        {m.nome}
                      </Link>
                    </td>
                    <td><SubgrupoBadge subgrupo={m.subgrupo} /></td>
                    <td className="text-slate-500">{m.dataEntrada ?? "—"}</td>
                    <td className="text-slate-500">{situacao.dataLimite ?? "—"}</td>
                    <td className={situacao.diasRestantes !== null && situacao.diasRestantes < 0 ? "font-semibold text-red-600" : "text-slate-600"}>
                      {situacao.diasRestantes === null
                        ? "—"
                        : situacao.diasRestantes < 0
                          ? `${-situacao.diasRestantes}d atrás`
                          : `${situacao.diasRestantes}d`}
                    </td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilo.cls}`}>{estilo.rotulo}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
