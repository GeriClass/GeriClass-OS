import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Mentor, type Mentorado } from "../lib/api";
import { Botao, Campo, Card, inputCls, SubgrupoBadge, TituloPagina, Vazio, WhatsAppLink } from "../components/ui";
import { SUBGRUPOS, SUBGRUPO_LABEL, type Subgrupo } from "@shared/constantes";

/** Normaliza para busca sem acentos e sem caixa. */
function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function Mentorados() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroSubgrupo, setFiltroSubgrupo] = useState<Subgrupo | "">("");
  const [filtroStatus, setFiltroStatus] = useState("ativo");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroMentor, setFiltroMentor] = useState("");
  const [criando, setCriando] = useState(false);

  const { data } = useQuery({
    queryKey: ["mentorados"],
    queryFn: () => api.get<{ mentorados: Mentorado[] }>("/mentorados"),
  });
  const { data: mentoresData } = useQuery({
    queryKey: ["mentores"],
    queryFn: () => api.get<{ mentores: Mentor[] }>("/mentores"),
  });

  const criar = useMutation({
    mutationFn: (dados: Record<string, unknown>) => api.post("/mentorados", dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorados"] });
      queryClient.invalidateQueries({ queryKey: ["bussolas"] });
      setCriando(false);
    },
  });

  const termo = normalizar(busca.trim());
  const lista = (data?.mentorados ?? []).filter(
    (m) =>
      (!filtroSubgrupo || m.subgrupo === filtroSubgrupo) &&
      (!filtroStatus || m.status === filtroStatus) &&
      (!filtroTurma || m.turma === filtroTurma) &&
      (!filtroMentor || m.mentorRecrutadorId === filtroMentor) &&
      (!termo ||
        normalizar(`${m.nome} ${m.email ?? ""} ${m.cidade ?? ""} ${m.whatsapp ?? ""}`).includes(termo)),
  );
  const turmas = [...new Set((data?.mentorados ?? []).map((m) => m.turma).filter(Boolean))].sort() as string[];

  return (
    <div>
      <TituloPagina acao={<Botao onClick={() => setCriando(!criando)}>{criando ? "Cancelar" : "+ Novo mentorado"}</Botao>}>
        Mentorados <span className="text-sm font-normal text-slate-400">({lista.length})</span>
      </TituloPagina>

      {criando && (
        <Card className="mb-4">
          <FormMentorado
            mentores={mentoresData?.mentores ?? []}
            enviando={criar.isPending}
            onSubmit={(dados) => criar.mutate(dados)}
          />
          {criar.isError && <p className="mt-2 text-sm text-red-600">{String(criar.error)}</p>}
        </Card>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="🔍 Buscar por nome, email, cidade, telefone…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className={inputCls + " max-w-80"}
        />
        <select value={filtroSubgrupo} onChange={(e) => setFiltroSubgrupo(e.target.value as Subgrupo | "")} className={inputCls + " max-w-40"}>
          <option value="">Todos os subgrupos</option>
          {SUBGRUPOS.map((s) => (
            <option key={s} value={s}>{SUBGRUPO_LABEL[s]}</option>
          ))}
        </select>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className={inputCls + " max-w-40"}>
          <option value="">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="pausado">Pausados</option>
          <option value="encerrado">Encerrados</option>
        </select>
        <select value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)} className={inputCls + " max-w-32"}>
          <option value="">Turma</option>
          {turmas.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={filtroMentor} onChange={(e) => setFiltroMentor(e.target.value)} className={inputCls + " max-w-44"}>
          <option value="">Mentor que captou</option>
          {(mentoresData?.mentores ?? []).map((m) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
      </div>

      <Card>
        {lista.length === 0 ? (
          <Vazio>Nenhum mentorado encontrado.</Vazio>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2">Nome</th>
                <th>Subgrupo</th>
                <th>Turma</th>
                <th>Cidade</th>
                <th>Entrada</th>
                <th>Contato</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lista.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2">
                    <Link to={`/mentorados/${m.id}`} className="font-medium text-gc-700 hover:underline">
                      {m.nome}
                    </Link>
                  </td>
                  <td><SubgrupoBadge subgrupo={m.subgrupo} /></td>
                  <td className="text-slate-500">{m.turma ?? "—"}</td>
                  <td className="text-slate-500">{m.cidade ? `${m.cidade}${m.uf ? "/" + m.uf : ""}` : "—"}</td>
                  <td className="text-slate-500">{m.dataEntrada ?? "—"}</td>
                  <td><WhatsAppLink numero={m.whatsapp} /></td>
                  <td className="capitalize text-slate-500">{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function FormMentorado({
  mentores,
  enviando,
  onSubmit,
}: {
  mentores: Mentor[];
  enviando: boolean;
  onSubmit: (dados: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    cidade: "",
    uf: "",
    subgrupo: "semente",
    dataEntrada: new Date().toISOString().slice(0, 10),
    mentorRecrutadorId: "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, mentorRecrutadorId: form.mentorRecrutadorId || null });
      }}
      className="grid gap-3 md:grid-cols-4"
    >
      <Campo rotulo="Nome *"><input required value={form.nome} onChange={set("nome")} className={inputCls} /></Campo>
      <Campo rotulo="Email"><input type="email" value={form.email} onChange={set("email")} className={inputCls} /></Campo>
      <Campo rotulo="WhatsApp"><input value={form.whatsapp} onChange={set("whatsapp")} className={inputCls} /></Campo>
      <Campo rotulo="Cidade"><input value={form.cidade} onChange={set("cidade")} className={inputCls} /></Campo>
      <Campo rotulo="UF"><input maxLength={2} value={form.uf} onChange={set("uf")} className={inputCls} /></Campo>
      <Campo rotulo="Subgrupo">
        <select value={form.subgrupo} onChange={set("subgrupo")} className={inputCls}>
          {SUBGRUPOS.map((s) => (
            <option key={s} value={s}>{SUBGRUPO_LABEL[s]}</option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Data de entrada">
        <input type="date" value={form.dataEntrada} onChange={set("dataEntrada")} className={inputCls} />
      </Campo>
      <Campo rotulo="Mentor que captou">
        <select value={form.mentorRecrutadorId} onChange={set("mentorRecrutadorId")} className={inputCls}>
          <option value="">—</option>
          {mentores.map((m) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
      </Campo>
      <div className="md:col-span-4">
        <Botao type="submit" disabled={enviando}>{enviando ? "Salvando…" : "Salvar mentorado"}</Botao>
      </div>
    </form>
  );
}
