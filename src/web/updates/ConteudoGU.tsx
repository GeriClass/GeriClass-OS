// Leitura de um conteúdo: markdown + player/embed + salvar. Marca como lido ao abrir.
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { guApi, type ConteudoDetalhe } from "./api";
import { Markdown, TemaBadge, TipoBadge, urlEmbedVideo } from "./ui";

export function ConteudoGU() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["gu-conteudo", id],
    queryFn: () => guApi.get<{ conteudo: ConteudoDetalhe }>(`/conteudos/${id}`),
  });
  const conteudo = data?.conteudo;

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["gu-feed"] });
    queryClient.invalidateQueries({ queryKey: ["gu-conteudo", id] });
  };
  const marcarLido = useMutation({
    mutationFn: () => guApi.put(`/conteudos/${id}/lido`, { valor: true }),
    onSuccess: invalidar,
  });
  const alternarSalvo = useMutation({
    mutationFn: (valor: boolean) => guApi.put(`/conteudos/${id}/salvo`, { valor }),
    onSuccess: invalidar,
  });

  // Abrir o conteúdo conta como leitura.
  useEffect(() => {
    if (conteudo && !conteudo.lido) marcarLido.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conteudo?.id, conteudo?.lido]);

  if (isLoading) return <p className="py-8 text-center text-sm text-slate-400">Carregando…</p>;
  if (isError || !conteudo)
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        Conteúdo não encontrado.{" "}
        <Link to="/updates" className="text-gc-600 underline">
          Voltar ao feed
        </Link>
      </div>
    );

  const embed = conteudo.linkVideo ? urlEmbedVideo(conteudo.linkVideo) : null;
  const dataPub = new Date(conteudo.publicadoEm).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article>
      <Link to="/updates" className="mb-3 inline-block text-sm text-gc-600">
        ← Feed
      </Link>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <TipoBadge tipo={conteudo.tipo} />
        {conteudo.tema && <TemaBadge tema={conteudo.tema} />}
      </div>
      <h1 className="text-xl leading-snug font-bold text-slate-900">{conteudo.titulo}</h1>
      <div className="mt-1 mb-4 flex items-center gap-3 text-xs text-slate-400">
        <span>{dataPub}</span>
        <button
          onClick={() => alternarSalvo.mutate(!conteudo.salvo)}
          className={`ml-auto rounded-full border px-3 py-1 font-medium transition ${
            conteudo.salvo ? "border-gc-600 bg-gc-50 text-gc-700" : "border-slate-200 text-slate-500"
          }`}
        >
          {conteudo.salvo ? "🔖 Salvo" : "Salvar"}
        </button>
      </div>

      {embed && (
        <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-slate-900">
          <iframe
            src={embed}
            title={conteudo.titulo}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {conteudo.linkVideo && !embed && (
        <a
          href={conteudo.linkVideo}
          target="_blank"
          rel="noreferrer"
          className="mb-4 block rounded-xl border border-slate-200 p-3 text-sm font-medium text-gc-600"
        >
          🎬 Assistir ao vídeo ↗
        </a>
      )}
      {conteudo.linkAudio && (
        <audio controls preload="none" src={conteudo.linkAudio} className="mb-4 w-full">
          <a href={conteudo.linkAudio}>Ouvir áudio</a>
        </audio>
      )}

      <Markdown texto={conteudo.corpo} />

      {conteudo.linkReferencia && (
        <a
          href={conteudo.linkReferencia}
          target="_blank"
          rel="noreferrer"
          className="mt-6 block rounded-xl bg-gc-50 p-3 text-sm font-medium text-gc-700"
        >
          📄 Ler o artigo original ↗
        </a>
      )}
    </article>
  );
}
