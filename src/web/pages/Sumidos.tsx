import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Mentorado } from "../lib/api";
import { Card, SubgrupoBadge, TituloPagina, Vazio } from "../components/ui";

interface ItemSumido {
  mentorado: Mentorado;
  diasSemContato: number | null;
  responsavel: string | null;
}

export function Sumidos() {
  const { data, isLoading } = useQuery({
    queryKey: ["sumidos"],
    queryFn: () => api.get<{ sumidos: ItemSumido[] }>("/healthscores/sumidos"),
  });

  if (isLoading) return <p className="text-slate-400">Calculando…</p>;
  const sumidos = data?.sumidos ?? [];

  return (
    <div>
      <TituloPagina>
        👻 Sumidos <span className="text-sm font-normal text-slate-400">({sumidos.length})</span>
      </TituloPagina>
      <p className="mb-4 text-sm text-slate-500">
        Mentorados ativos sem qualquer contato registrado (presença, sessão ou tarefa concluída) há mais de{" "}
        <strong>21 dias</strong>. Rotina de segunda-feira: cada um tem um responsável pela reconexão — por padrão, o
        mentor que captou.
      </p>
      <Card>
        {sumidos.length === 0 ? (
          <Vazio>Ninguém sumido. 🎉</Vazio>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2">Mentorado</th>
                <th>Subgrupo</th>
                <th>Dias sem contato</th>
                <th>WhatsApp</th>
                <th>Responsável pela reconexão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sumidos.map(({ mentorado: m, diasSemContato, responsavel }) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2">
                    <Link to={`/mentorados/${m.id}`} className="font-medium text-gc-700 hover:underline">
                      {m.nome}
                    </Link>
                  </td>
                  <td><SubgrupoBadge subgrupo={m.subgrupo} /></td>
                  <td className="font-semibold text-red-600">{diasSemContato === null ? "nunca registrado" : `${diasSemContato}d`}</td>
                  <td className="text-slate-500">{m.whatsapp ?? "—"}</td>
                  <td>{responsavel ?? <span className="text-amber-600">definir!</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
