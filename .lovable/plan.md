## Plano — Aplicar template oficial do contrato

Vou substituir o template provisório no banco pelo texto oficial completo e ampliar o formulário de "Novo contrato" para cobrir todos os campos que o contrato exige.

### 1. Template no banco (`contrato_templates`)

Atualizar o registro ativo `autorizacao_venda_exclusividade` com o texto oficial, renderizado dinamicamente:

- **PF vs PJ**: o template inclui dois blocos no qualificação do CONTRATANTE. Em vez de manter os dois no PDF, o sistema seleciona o bloco correto via `{{#if pessoa_juridica}}…{{else}}…{{/if}}` (renderizador simples no `src/lib/contratos.ts`).
- **Segundo contratante (cônjuge/sócio)**: bloco opcional `{{#if contratante2_nome}}…{{/if}}`.
- Dados fixos da CONTRATADA (HR Corretor de Imóveis LTDA, Hans, CRECI etc.) ficam embutidos no texto — não viram campo no formulário.
- Comissão padrão **5%** e prazo padrão **12 meses** já configurados.

### 2. Novos campos no formulário (`NovoContratoDialog`)

Organizado em seções (accordion/abas) para não sobrecarregar:

**Tipo do contratante**
- Pessoa Física / Pessoa Jurídica (radio)

**Contratante (PF)**
- Nome, nascimento, estado civil, profissão, RG, CPF, e-mail, telefone
- Endereço (logradouro, número, bairro, cidade, estado, CEP)
- Segundo contratante (cônjuge) — toggle "Adicionar segundo contratante" expõe os mesmos campos

**Contratante (PJ)**
- Razão social, CNPJ, endereço da sede (logradouro, nº, bairro, cidade, estado, CEP)
- Sócio representante: nome, nascimento, estado civil, profissão, RG, CPF, e-mail, telefone, endereço residencial

**Imóvel** (já existente, ampliado)
- Seleção do imóvel cadastrado **e** campos editáveis derivados: endereço completo, lote, quadra, área total, área construída, matrícula, benfeitorias
- Pré-preenchimento a partir do imóvel selecionado; campos editáveis caso a base não tenha o dado

**Negócio**
- Valor de venda (R$) e valor por extenso (gerado automaticamente; editável)
- Forma/condição de pagamento da comissão (texto livre — vai no Parágrafo terceiro da Cláusula Quarta)
- Comissão (%) — padrão 5
- Prazo de exclusividade em **meses** (não mais em dias) — padrão 12
- Prazo da proteção pós-contratual em meses (Cláusula Sexta) — padrão 12
- Cidade/UF da assinatura e data — padrão Sinop/MT + hoje
- Observações

### 3. Ajustes técnicos

- `src/lib/contratos.ts`: adicionar mini-engine para `{{#if x}}…{{/if}}` (substitui o `renderTemplate` atual mantendo `{{var}}`); helper `valorPorExtenso(n)` em pt-BR (sem dependência nova, função local).
- `src/components/contratos/NovoContratoDialog.tsx`: expandir formulário em seções e enviar o conjunto completo de variáveis para o renderizador.
- `src/pages/Contratos.tsx`: na coluna "Cliente" e no envio para assinatura, usar `cliente_nome` (= razão social para PJ, ou nome do contratante 1 para PF), já compatível.
- **Banco**: nenhuma alteração de schema necessária — a tabela `contratos` já tem `conteudo_renderizado` (texto final), `observacoes` e demais campos. Os campos detalhados de PF/PJ são gravados como JSON em `observacoes`? Não: melhor adicionar **uma coluna `dados_partes jsonb`** em `contratos` para guardar todos os dados das partes (sem inflar o schema com 30 colunas), permitindo reabrir e reimprimir o contrato depois.

### 4. PDF

- Mantém `jsPDF` já instalado.
- Título: "CONTRATO DE INTERMEDIAÇÃO IMOBILIÁRIA COM CLÁUSULA DE EXCLUSIVIDADE" (atualizado).
- Bloco final de assinaturas (CONTRATANTE / CONTRATADA / TESTEMUNHAS) já vem no texto do template.

### 5. Migrations necessárias

1. `ALTER TABLE contratos ADD COLUMN dados_partes jsonb`.
2. `UPDATE contrato_templates SET conteudo = <texto oficial completo com placeholders e blocos condicionais> WHERE tipo = 'autorizacao_venda_exclusividade' AND ativo = true`.

### Fora de escopo deste passo

- Editor visual de template no admin (a tabela já existe; UI fica para depois).
- Coleta de assinatura das testemunhas dentro do ClickSign (hoje só CONTRATANTE e CONTRATADA são signatários padrão).
