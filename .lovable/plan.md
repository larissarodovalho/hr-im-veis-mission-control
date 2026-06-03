## Alterar label do estágio "detalhamento" no funil de captação

### Contexto
Na aba **Imóveis → Captação**, o funil de captação de imóveis possui 6 estágios. O terceiro estágio (id: `"detalhamento"`) atualmente exibe o label **"Detalhamento enviado"**.

### Mudança solicitada
Alterar o label do estágio `"detalhamento"` de:
- **"Detalhamento enviado"** → **"Enviar detalhamento 24 horas antes"**

### Arquivo afetado
- `src/lib/captacaoFunil.ts` — array `ESTAGIOS_CAPTACAO`, linha 12

### Escopo
Apenas texto de exibição. Nenhuma mudança em lógica de negócio, banco de dados, APIs ou outros componentes.