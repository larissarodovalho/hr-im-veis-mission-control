# Adicionar etapa "Cadastro do imóvel" no funil de Captação

Nova etapa entre **Captação agendada** e **Concluído** na subaba *Captação* (Imóveis).

## Funil atualizado
```
Novo → Agendar → Detalhamento → Captação agendada → Cadastro do imóvel → Concluído
```

## Alterações

### 1. `src/lib/captacaoFunil.ts`
- Adicionar `"cadastro"` ao tipo `EstagioCaptacao`.
- Inserir item no array `ESTAGIOS_CAPTACAO` entre `agendada` e `concluido`:
  - id: `cadastro`
  - label: `"Cadastro do imóvel"`
  - color: tom violeta/roxo (`bg-violet-500/10 border-violet-500/30`) para distinguir das demais.

### 2. Banco de dados
- A coluna `estagio` em `captacoes_imovel` é `text` livre (sem CHECK constraint detectada). Não precisa de migração.
- Caso exista constraint, será adicionada via migração ajustando o CHECK para incluir `'cadastro'`.

### 3. UI (`src/pages/imoveis/CaptacaoTab.tsx`)
- Nenhuma alteração de código necessária: o grid já renderiza dinamicamente todas as etapas via `ESTAGIOS_CAPTACAO.map(...)` e o layout já é `xl:grid-cols-5` — passará a ter 6 colunas. Ajustar para `xl:grid-cols-6` para acomodar a nova coluna sem quebrar em telas grandes (mantém `lg:grid-cols-3` e `md:grid-cols-2`).

## Comportamento
- Drag-and-drop funciona automaticamente para a nova etapa.
- Cards existentes permanecem nos estágios atuais; usuário move manualmente para "Cadastro do imóvel" quando iniciar o cadastro do imóvel no sistema, e para "Concluído" após finalizar.
