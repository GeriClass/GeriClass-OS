import { useQuery } from "@tanstack/react-query";
import { guApi, type ConteudoFeed } from "./api";
import { CartaoConteudo } from "./FeedGU";
import { Vazio } from "../components/ui";

export function SalvosGU() {
  const { data, isLoading } = useQuery({
    queryKey: ["gu-feed", "salvos"],
    queryFn: () => guApi.get<{ conteudos: ConteudoFeed[] }>("/feed?salvos=1"),
  });

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">Salvos</h1>
      {isLoading ? (
        <p className="py-8 text-center text-sm text-slate-400">Carregando…</p>
      ) : !data?.conteudos.length ? (
        <Vazio>Você ainda não salvou nenhum conteúdo. Toque em "Salvar" ao ler para guardar aqui.</Vazio>
      ) : (
        <div className="space-y-2">
          {data.conteudos.map((ct) => (
            <CartaoConteudo key={ct.id} conteudo={ct} />
          ))}
        </div>
      )}
    </div>
  );
}
