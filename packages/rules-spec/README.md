# rules-spec — reglas compartidas de escaneo

Fuente única de verdad de la clasificación de lecturas, para que el **servidor
(TypeScript)** y el **PDA (Kotlin)** decidan exactamente igual.

- `vectors.json` — fixture (maestro + surtido) y casos con su resultado esperado.
- El servidor los corre con `apps/web/modules/reception/run-vectors.ts`.
- El PDA los corre en un test Kotlin equivalente.

Estado: verificado — 13/13 casos OK en TypeScript y en Kotlin (misma fuente).

CI debe correr AMBOS lados contra este archivo y fallar si alguno diverge.
Casos cubiertos: EAN en surtido, código alterno del mismo SKU, separadores con
espacio/guion, cero inicial, sobrante (en maestro fuera de surtido), no
identificado, QR/URL, texto libre, conflicto código→2 SKU, y recepción sin surtido.
El anti-doble-evento (dedupe por tiempo) es de estado y se prueba en el motor del PDA.
