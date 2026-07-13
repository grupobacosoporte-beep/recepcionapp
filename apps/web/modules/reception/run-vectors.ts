import { readFileSync } from "node:fs";
import { buildCatalog, classify, Mode, ResultType } from "./rules";

const v = JSON.parse(readFileSync(new URL("../../../../packages/rules-spec/vectors.json", import.meta.url), "utf8"));
const catalog = buildCatalog(v.maestro);
const surtido = new Set<string>(v.surtido);
let pass = 0, fail = 0;
for (const c of v.casos) {
  const got = classify(c.scan, catalog, surtido, c.modo as Mode).result;
  const ok = got === (c.esperado as ResultType);
  console.log(`${ok ? "OK " : "FAIL"} | ${c.nombre.padEnd(32)} -> ${got}`);
  ok ? pass++ : fail++;
}
console.log(`\nTS: ${pass}/${pass + fail} casos OK`);
if (fail) process.exit(1);
