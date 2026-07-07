// Componentes do app do assinante — mobile-first, tom "leitura".
import { marked } from "marked";
import { TIPO_CONTEUDO_GU_LABEL, type TipoConteudoGu } from "@shared/constantes";

const ICONE_TIPO: Record<TipoConteudoGu, string> = {
  artigo: "📄",
  video: "🎬",
  audio: "🎧",
  material: "📎",
};

export function TipoBadge({ tipo }: { tipo: TipoConteudoGu }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gc-50 px-2 py-0.5 text-xs font-medium text-gc-700">
      {ICONE_TIPO[tipo]} {TIPO_CONTEUDO_GU_LABEL[tipo]}
    </span>
  );
}

export function TemaBadge({ tema }: { tema: string }) {
  return (
    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{tema}</span>
  );
}

/** Corpo em markdown (conteúdo autorado pela equipe). */
export function Markdown({ texto }: { texto: string }) {
  const html = marked.parse(texto, { async: false, breaks: true });
  return (
    <div
      className="prose-gu space-y-3 text-[15px] leading-relaxed text-slate-800"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Converte link de YouTube/Vimeo em URL de embed; outros links não são embutidos. */
export function urlEmbedVideo(link: string): string | null {
  const yt = link.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = link.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "Hoje", "Ontem" ou "12 mai" — agrupamento humano do feed. */
export function rotuloDia(iso: string): string {
  const data = new Date(iso);
  const hoje = new Date();
  const umDia = 24 * 60 * 60 * 1000;
  const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((inicioDia(hoje) - inicioDia(data)) / umDia);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  const rotulo = `${data.getDate()} ${MESES[data.getMonth()]}`;
  return data.getFullYear() === hoje.getFullYear() ? rotulo : `${rotulo} ${data.getFullYear()}`;
}
