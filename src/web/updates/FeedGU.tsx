// Feed do assinante: conteúdos publicados agrupados por dia, com busca e filtros.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { guApi, type ConteudoFeed } from "./api";
import { TipoBadge, rotuloDia } from "./ui";
import { Vazio } from "../components/ui";
import { TIPOS_CONTEUDO_GU, TIPO_CONTEUDO_GU_LABEL } from "@shared/constantes";

interface Feed {
  conteudos: ConteudoFeed[];
  temas: string[];
}

export function CartaoConteudo({ conteudo }: { conteudo: ConteudoFeed }) {
  return (
    <Link
      to={`/updates/conteudos/${conteudo.id}`}
      className={`block rounded-xl border p-3 transition active:scale-[0.99] ${
        conteudo.lido ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <TipoBadge tipo={conteudo.tipo} />
        {conteudo.tema && <span className="text-xs text-slate-400">{conteudo.tema}</span>}
        <span className="ml-auto flex items-center gap-1 text-xs">
          {conteudo.salvo && <span title="Salvo">🔖</span>}
          {!conteudo.lido && <span className="h-2 w-2 rounded-full bg-gc-500" title="Não lido" />}
        </span>
      </div>
      <h3 className={`text-[15px] leading-snug font-semibold ${conteudo.lido ? "text-slate-500" : "text-slate-900"}`}>
        {conteudo.titulo}
      </h3>
      {conteudo.resumo && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{conteudo.resumo}</p>}
    </Link>
  );
}

export function FeedGU() {
  const [busca, setBusca] = useState("");
  const [tema, setTema] = useState("");
  const [tipo, setTipo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["gu-feed", busca, tema, tipo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (busca) params.set("q", busca);
      if (tema) params.set("tema", tema);
      if (tipo) params.set("tipo", tipo);
      const qs = params.toString();
      return guApi.get<Feed>(`/feed${qs ? `?${qs}` : ""}`);
    },
  });

  const grupos = useMemo(() => {
    const porDia = new Map<string, ConteudoFeed[]>();
    for (const ct of data?.conteudos ?? []) {
      const rotulo = rotuloDia(ct.publicadoEm);
      const grupo = porDia.get(rotulo) ?? [];
      grupo.push(ct);
      porDia.set(rotulo, grupo);
    }
    return [...porDia.entries()];
  }, [data]);

  return (
    <div>
      <input
        type="search"
        placeholder="Buscar conteúdos…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mb-3 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-gc-500 focus:outline-none"
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 text-xs">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 focus:outline-none"
        >
          <option value="">Todos os formatos</option>
          {TIPOS_CONTEUDO_GU.map((t) => (
            <option key={t} value={t}>
              {TIPO_CONTEUDO_GU_LABEL[t]}
            </option>
          ))}
        </select>
        {(data?.temas ?? []).map((t) => (
          <button
            key={t}
            onClick={() => setTema(tema === t ? "" : t)}
            className={`shrink-0 rounded-full border px-3 py-1.5 font-medium whitespace-nowrap transition ${
              tema === t ? "border-gc-600 bg-gc-600 text-white" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-slate-400">Carregando…</p>
      ) : !grupos.length ? (
        <Vazio>Nenhum conteúdo encontrado.</Vazio>
      ) : (
        <div className="space-y-5">
          {grupos.map(([dia, conteudos]) => (
            <section key={dia}>
              <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{dia}</h2>
              <div className="space-y-2">
                {conteudos.map((ct) => (
                  <CartaoConteudo key={ct.id} conteudo={ct} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
