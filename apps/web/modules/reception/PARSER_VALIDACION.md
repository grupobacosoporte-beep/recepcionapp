# Validación del parser de surtido

Contra un surtido real de Farmacias del Dr. Simi (pedido 412258, 6 páginas):

| Métrica   | Parser TS | pdfplumber (oracle) |
|-----------|:---------:|:-------------------:|
| Cartones  | 23        | 23                  |
| Productos | 175       | 175                 |
| Unidades  | 1815      | 1815                |

Casos difíciles verificados: códigos que son números sueltos (796, 428, 453,
480, 246, 315, 1482, 1780) y nombre de producto largo con símbolos
(SALBUTAMOL/IPRATROPIO 100/20MCG (250 DOSIS) X 12.5 ML). El "Cartón : Multiple"
de la cabecera se ignora correctamente.
