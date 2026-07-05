import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Db = ReturnType<typeof criarDb>;

export function criarDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export { schema };
