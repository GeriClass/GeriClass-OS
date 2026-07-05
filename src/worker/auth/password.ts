// Hash de senha com PBKDF2 via WebCrypto (nativo no Workers).
// Formato armazenado: pbkdf2$<iterações>$<salt base64>$<hash base64>

const ITERACOES = 100_000;
const TAMANHO_HASH_BITS = 256;

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function derivar(senha: string, salt: Uint8Array, iteracoes: number): Promise<ArrayBuffer> {
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, [
    "deriveBits",
  ]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: iteracoes },
    chave,
    TAMANHO_HASH_BITS,
  );
}

export async function hashSenha(senha: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivar(senha, salt, ITERACOES);
  return `pbkdf2$${ITERACOES}$${toBase64(salt.buffer)}$${toBase64(hash)}`;
}

export async function verificarSenha(senha: string, armazenado: string): Promise<boolean> {
  const partes = armazenado.split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2") return false;
  const iteracoes = parseInt(partes[1], 10);
  const salt = fromBase64(partes[2]);
  const esperado = fromBase64(partes[3]);
  const hash = new Uint8Array(await derivar(senha, salt, iteracoes));
  if (hash.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash[i] ^ esperado[i];
  return diff === 0;
}
