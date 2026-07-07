// Painel da equipe: publica conteúdos do GeriUpdates e gerencia assinantes.
// O app do assinante fica em /updates (PWA instalável no celular).
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Botao, Campo, Card, inputCls, TituloPagina, Vazio, WhatsAppLink } from "../components/ui";
import {
  STATUS_ASSINANTE,
  TIPOS_CONTEUDO_GU,
  TIPO_CONTEUDO_GU_LABEL,
  type StatusAssinante,
  type StatusConteudoGu,
  type TipoConteudoGu,
} from "@shared/constantes";

interface ConteudoAdmin {
  id: string;
  titulo: string;
  resumo: string | null;
  corpo: string;
  tipo: TipoConteudoGu;
  tema: string | null;
  linkReferencia: string | null;
  linkVideo: string | null;
  linkAudio: string | null;
  publicadoEm: string | null;
  status: StatusConteudoGu;
  numLeituras: number;
}

interface AssinanteAdmin {
  id: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  status: StatusAssinante;
  ultimoAcessoEm: string | null;
  numLeituras: number;
}

const COR_STATUS: Record<StatusConteudoGu, string> = {
  rascunho: "bg-slate-100 text-slate-600",
  agendado: "bg-amber-100 text-amber-800",
  publicado: "bg-emerald-100 text-emerald-800",
};

export function GeriUpdates() {
  const [aba, setAba] = useState<"conteudos" | "assinantes">("conteudos");

  return (
    <div>
      <TituloPagina
        acao={
          <a href="/updates" target="_blank" rel="noreferrer" className="text-sm text-gc-600 hover:underline">
            Abrir app do assinante ↗
          </a>
        }
      >
        GeriUpdates
      </TituloPagina>

      <div className="mb-4 flex gap-1 border-b border-slate-200 text-sm">
        {(["conteudos", "assinantes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setAba(t)}
            className={`-mb-px border-b-2 px-4 py-2 font-medium transition ${
              aba === t ? "border-gc-600 text-gc-700" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t === "conteudos" ? "Conteúdos" : "Assinantes"}
          </button>
        ))}
      </div>

      {aba === "conteudos" ? <AbaConteudos /> : <AbaAssinantes />}
    </div>
  );
}

// ─── Conteúdos ────────────────────────────────────────────────────────────────

function AbaConteudos() {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<ConteudoAdmin | "novo" | null>(null);

  const { data } = useQuery({
    queryKey: ["gu-admin-conteudos"],
    queryFn: () => api.get<{ conteudos: ConteudoAdmin[] }>("/geriupdates/conteudos"),
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["gu-admin-conteudos"] });
  const salvar = useMutation({
    mutationFn: (dados: Record<string, unknown>) =>
      editando && editando !== "novo"
        ? api.patch(`/geriupdates/conteudos/${editando.id}`, dados)
        : api.post("/geriupdates/conteudos", dados),
    onSuccess: () => {
      invalidar();
      setEditando(null);
    },
  });
  const publicarAgora = useMutation({
    mutationFn: (id: string) => api.patch(`/geriupdates/conteudos/${id}`, { publicadoEm: new Date().toISOString() }),
    onSuccess: invalidar,
  });
  const despublicar = useMutation({
    mutationFn: (id: string) => api.patch(`/geriupdates/conteudos/${id}`, { publicadoEm: null }),
    onSuccess: invalidar,
  });

  return (
    <div className="space-y-4">
      {editando ? (
        <Card>
          <FormConteudo
            inicial={editando === "novo" ? null : editando}
            enviando={salvar.isPending}
            onSubmit={(dados) => salvar.mutate(dados)}
            onCancelar={() => setEditando(null)}
          />
          {salvar.isError && <p className="mt-2 text-sm text-red-600">{String(salvar.error)}</p>}
        </Card>
      ) : (
        <Botao onClick={() => setEditando("novo")}>+ Novo conteúdo</Botao>
      )}

      <Card>
        {!data?.conteudos.length ? (
          <Vazio>Nenhum conteúdo ainda. Crie o primeiro update do dia.</Vazio>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2">Título</th><th>Tipo</th><th>Tema</th><th>Status</th><th>Publicação</th><th>Leituras</th><th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.conteudos.map((ct) => (
                <tr key={ct.id}>
                  <td className="max-w-sm py-2 pr-2 font-medium">{ct.titulo}</td>
                  <td className="text-slate-500">{TIPO_CONTEUDO_GU_LABEL[ct.tipo]}</td>
                  <td className="text-slate-500">{ct.tema ?? "—"}</td>
                  <td>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COR_STATUS[ct.status]}`}>
                      {ct.status}
                    </span>
                  </td>
                  <td className="text-slate-500">
                    {ct.publicadoEm ? new Date(ct.publicadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </td>
                  <td className="text-slate-500">{ct.numLeituras}</td>
                  <td className="space-x-2 text-right text-xs whitespace-nowrap">
                    <button onClick={() => setEditando(ct)} className="text-gc-600 hover:underline">editar</button>
                    {ct.status === "publicado" ? (
                      <button onClick={() => despublicar.mutate(ct.id)} className="text-slate-500 hover:underline">despublicar</button>
                    ) : (
                      <button onClick={() => publicarAgora.mutate(ct.id)} className="text-emerald-600 hover:underline">publicar agora</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function paraDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function FormConteudo({
  inicial,
  enviando,
  onSubmit,
  onCancelar,
}: {
  inicial: ConteudoAdmin | null;
  enviando: boolean;
  onSubmit: (dados: Record<string, unknown>) => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState({
    titulo: inicial?.titulo ?? "",
    resumo: inicial?.resumo ?? "",
    corpo: inicial?.corpo ?? "",
    tipo: inicial?.tipo ?? "artigo",
    tema: inicial?.tema ?? "",
    linkReferencia: inicial?.linkReferencia ?? "",
    linkVideo: inicial?.linkVideo ?? "",
    linkAudio: inicial?.linkAudio ?? "",
    publicadoEm: paraDatetimeLocal(inicial?.publicadoEm ?? null),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          titulo: form.titulo,
          resumo: form.resumo || null,
          corpo: form.corpo,
          tipo: form.tipo,
          tema: form.tema || null,
          linkReferencia: form.linkReferencia || null,
          linkVideo: form.linkVideo || null,
          linkAudio: form.linkAudio || null,
          publicadoEm: form.publicadoEm ? new Date(form.publicadoEm).toISOString() : null,
        });
      }}
      className="grid gap-3 md:grid-cols-3"
    >
      <div className="md:col-span-2">
        <Campo rotulo="Título *"><input required value={form.titulo} onChange={set("titulo")} className={inputCls} /></Campo>
      </div>
      <Campo rotulo="Tipo">
        <select value={form.tipo} onChange={set("tipo")} className={inputCls}>
          {TIPOS_CONTEUDO_GU.map((t) => (
            <option key={t} value={t}>{TIPO_CONTEUDO_GU_LABEL[t]}</option>
          ))}
        </select>
      </Campo>
      <div className="md:col-span-2">
        <Campo rotulo="Resumo (chamada no feed)"><input value={form.resumo} onChange={set("resumo")} className={inputCls} /></Campo>
      </div>
      <Campo rotulo="Tema (ex.: Demência, Polifarmácia)"><input value={form.tema} onChange={set("tema")} className={inputCls} /></Campo>
      <div className="md:col-span-3">
        <Campo rotulo="Corpo * (markdown: **negrito**, - listas, ## títulos)">
          <textarea required rows={10} value={form.corpo} onChange={set("corpo")} className={`${inputCls} font-mono`} />
        </Campo>
      </div>
      <Campo rotulo="Link do artigo original"><input type="url" value={form.linkReferencia} onChange={set("linkReferencia")} className={inputCls} /></Campo>
      <Campo rotulo="Link de vídeo (YouTube/Vimeo)"><input type="url" value={form.linkVideo} onChange={set("linkVideo")} className={inputCls} /></Campo>
      <Campo rotulo="Link de áudio (mp3)"><input type="url" value={form.linkAudio} onChange={set("linkAudio")} className={inputCls} /></Campo>
      <Campo rotulo="Publicação (vazio = rascunho; futuro = agendado)">
        <input type="datetime-local" value={form.publicadoEm} onChange={set("publicadoEm")} className={inputCls} />
      </Campo>
      <div className="flex items-end gap-2 md:col-span-2">
        <Botao type="submit" disabled={enviando}>{enviando ? "Salvando…" : inicial ? "Salvar alterações" : "Criar conteúdo"}</Botao>
        <Botao type="button" variante="secundario" onClick={onCancelar}>Cancelar</Botao>
      </div>
    </form>
  );
}

// ─── Assinantes ───────────────────────────────────────────────────────────────

function AbaAssinantes() {
  const queryClient = useQueryClient();
  const [criando, setCriando] = useState(false);

  const { data } = useQuery({
    queryKey: ["gu-admin-assinantes"],
    queryFn: () => api.get<{ assinantes: AssinanteAdmin[] }>("/geriupdates/assinantes"),
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["gu-admin-assinantes"] });
  const criar = useMutation({
    mutationFn: (dados: Record<string, unknown>) => api.post("/geriupdates/assinantes", dados),
    onSuccess: () => {
      invalidar();
      setCriando(false);
    },
  });
  const mudarStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusAssinante }) =>
      api.patch(`/geriupdates/assinantes/${id}`, { status }),
    onSuccess: invalidar,
  });

  return (
    <div className="space-y-4">
      <Botao onClick={() => setCriando(!criando)}>{criando ? "Cancelar" : "+ Novo assinante"}</Botao>

      {criando && (
        <Card>
          <FormAssinante enviando={criar.isPending} onSubmit={(dados) => criar.mutate(dados)} />
          {criar.isError && <p className="mt-2 text-sm text-red-600">{String(criar.error)}</p>}
        </Card>
      )}

      <Card>
        {!data?.assinantes.length ? (
          <Vazio>Nenhum assinante cadastrado.</Vazio>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2">Nome</th><th>Email</th><th>WhatsApp</th><th>Status</th><th>Último acesso</th><th>Leituras</th><th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.assinantes.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 font-medium">{a.nome}</td>
                  <td className="text-slate-500">{a.email}</td>
                  <td><WhatsAppLink numero={a.whatsapp} /></td>
                  <td>
                    <select
                      value={a.status}
                      onChange={(e) => mudarStatus.mutate({ id: a.id, status: e.target.value as StatusAssinante })}
                      className="rounded border border-slate-200 px-1 py-0.5 text-xs"
                    >
                      {STATUS_ASSINANTE.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-slate-500">
                    {a.ultimoAcessoEm ? new Date(a.ultimoAcessoEm).toLocaleDateString("pt-BR") : "nunca"}
                  </td>
                  <td className="text-slate-500">{a.numLeituras}</td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function FormAssinante({ enviando, onSubmit }: { enviando: boolean; onSubmit: (dados: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ nome: "", email: "", senha: "", whatsapp: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, whatsapp: form.whatsapp || undefined });
      }}
      className="grid gap-3 md:grid-cols-4"
    >
      <Campo rotulo="Nome *"><input required value={form.nome} onChange={set("nome")} className={inputCls} /></Campo>
      <Campo rotulo="Email *"><input required type="email" value={form.email} onChange={set("email")} className={inputCls} /></Campo>
      <Campo rotulo="Senha inicial * (mín. 8)"><input required minLength={8} value={form.senha} onChange={set("senha")} className={inputCls} /></Campo>
      <Campo rotulo="WhatsApp"><input value={form.whatsapp} onChange={set("whatsapp")} className={inputCls} /></Campo>
      <div className="md:col-span-4">
        <Botao type="submit" disabled={enviando}>{enviando ? "Criando…" : "Criar assinante"}</Botao>
      </div>
    </form>
  );
}
