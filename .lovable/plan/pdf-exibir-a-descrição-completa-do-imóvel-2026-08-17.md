# PDF: exibir a descrição completa do imóvel

## Problema
Na página de "Detalhes" do PDF, a descrição pública é truncada para caber na coluna esquerda de uma única página (`slice(0, maxLinhasDesc)` em `src/lib/imovelPdf.ts`, linha ~364). Descrições longas são cortadas e o cliente não vê o texto completo.

## Solução
Permitir que a descrição ocupe quantas páginas forem necessárias, fluindo naturalmente, em vez de truncar.

### Mudança em `src/lib/imovelPdf.ts`

1. **Detalhes — descrição em coluna esquerda (página atual):**
   - Manter o layout de duas colunas (descrição à esquerda, condições + características à direita) quando a descrição cabe.
   - Quando a descrição **não cabe** na coluna esquerda, renderizar o que couber e marcar que há texto restante.

2. **Páginas de continuação (overflow):**
   - Se sobrou texto da descrição, adicionar uma (ou mais) páginas extras **antes da faixa de contato final**, usando a largura total da página (`PAGE_W - MARGIN*2`) para a descrição, com o cabeçalho "SOBRE O IMÓVEL (continuação)" e rodapé com numeração.
   - Repetir até esgotar o texto, criando quantas páginas forem necessárias.

3. **Numeração dinâmica:**
   - `totalPaginas` deve ser recalculado para incluir as páginas de overflow da descrição. Como o total depende do fluxo de renderização (só sabemos quantas páginas de overflow precisamos depois de quebrar o texto), calcular o total de páginas **antes** de renderizar: dividir o texto da descrição em linhas via `splitTextToSize`, contar quantas cabem na primeira coluna e quantas páginas extras de largura total são necessárias, somar ao total base (capa + galeria + detalhes).

4. **Condições e características:**
   - Permanecem na página de detalhes original (coluna direita), independentemente do overflow da descrição.

### Estrutura final do PDF
```text
Pág. 1        — CAPA
Pág. 2 (opc.) — GALERIA (se >1 foto)
Pág. 3        — DETALHES (descrição parcial à esquerda + condições/características à direita)
Pág. 4..N     — DESCRIÇÃO (continuação, largura total) — só se a descrição não couber
Pág. N+1      — FAIXA DE CONTATO (rodapé final)
```
Quando a faixa de contato fica sozinha numa página (após overflow), ela continua como hoje — barra escura no rodapé.

## QA
- Gerar o PDF com uma descrição longa (1000+ caracteres) via script headless, converter as páginas em imagens e confirmar que todo o texto aparece, sem truncamento, e que a numeração e os rodapés estão corretos.
