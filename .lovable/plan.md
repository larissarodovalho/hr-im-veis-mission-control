## Plano — Aba "Contratos" no CRM

Adicionar uma nova aba **Contratos** ao CRM para gerar contratos de **Autorização de Venda com Exclusividade** a partir de um modelo padrão, preenchendo automaticamente dados do cliente, do imóvel e o valor. O contrato gerado pode ser enviado para assinatura digital (reutilizando o fluxo ClickSign já existente).

### 1. Banco de dados

Nova tabela `contratos`:
- `tipo` (padrão `autorizacao_venda_exclusividade`)
- `lead_id` / `conta_id` (cliente)
- `imovel_id`
- `valor` (valor autorizado de venda)
- `prazo_dias` (vigência da exclusividade, ex.: 180)
- `data_inicio`, `data_fim`
- `comissao_percentual`
- `observacoes`
- `status`: `rascunho` | `gerado` | `enviado_assinatura` | `assinado` | `cancelado` | `expirado`
- `pdf_url` (PDF gerado/anexado no bucket existente)
- `signed_document_id` (FK lógica para `signed_documents` quando enviado p/ ClickSign)
- `corretor_id`, `created_by`, `created_at`, `updated_at`

RLS:
- Admin/Gestor: tudo
- Corretor: vê/edita apenas onde `corretor_id = auth.uid()` ou `created_by = auth.uid()`
- Só admin pode deletar

Tabela `contrato_templates` (opcional, simples):
- `nome`, `conteudo` (HTML/markdown com placeholders `{{cliente_nome}}`, `{{imovel_endereco}}`, `{{valor}}`, etc.), `ativo`
- Admin gerencia; staff lê
- Já semeado com o template padrão de Autorização de Venda com Exclusividade

### 2. Navegação

- Adicionar item **Contratos** em `CRM_SUBTABS` (`src/components/AppSidebar.tsx`), ícone `FileSignature`
- Rota `/crm/contratos` em `src/App.tsx` apontando para `ContratosPage`
- Liberar para corretor (incluir `"contratos"` em `CORRETOR_ALLOWED_CRM`)

### 3. Telas (frontend)

**`src/pages/Contratos.tsx`** — lista
- Filtros: status, corretor (admin/gestor), busca por cliente/imóvel
- Tabela: cliente, imóvel, valor, status (badge), data, ações (ver, editar, enviar p/ assinatura, baixar PDF, cancelar)
- Botão "Novo contrato"

**`src/components/contratos/NovoContratoDialog.tsx`**
- Seleciona Lead/Conta (cliente)
- Seleciona Imóvel (busca em `imoveis`)
- Valor, prazo, comissão, observações — pré-preenchidos a partir do imóvel/lead quando possível
- Botão "Gerar contrato" → cria registro `rascunho` + gera PDF a partir do template
- Botão "Gerar e enviar para assinatura" → cria + abre `SendDocumentDialog` existente

**`src/pages/ContratoDetalhe.tsx`** (opcional, ou drawer)
- Visualiza dados, PDF, signatários, histórico, ações de status

### 4. Geração do PDF

- Renderizar o template substituindo placeholders no cliente
- Gerar PDF via `jspdf` + `html2canvas` (ou `pdfmake`) — sem nova dependência pesada se já existir
- Upload no bucket `signed-documents` (privado) e salvar `pdf_url`

### 5. Integração com assinatura

- Reutilizar `SendDocumentDialog` e edge functions `clicksign-*`
- Ao enviar: criar `signed_documents` referenciando o PDF do contrato, salvar `signed_document_id` no contrato e mudar status para `enviado_assinatura`
- Webhook ClickSign já existente atualiza `signed_documents`; um pequeno trigger/handler sincroniza status no `contratos` quando o documento vinculado for assinado/cancelado

### 6. Template padrão

Cadastrar via migration o conteúdo padrão do contrato de Autorização de Venda com Exclusividade com placeholders:
`{{cliente_nome}}`, `{{cliente_documento}}`, `{{cliente_endereco}}`, `{{imovel_endereco}}`, `{{imovel_codigo}}`, `{{imovel_area}}`, `{{valor}}`, `{{valor_extenso}}`, `{{comissao_percentual}}`, `{{prazo_dias}}`, `{{data_inicio}}`, `{{data_fim}}`, `{{corretor_nome}}`, `{{cidade_data}}`.

Admin pode editar depois em **Configurações → Templates de contrato** (fora deste escopo inicial, mas a tabela já fica pronta).

---

### Confirmações antes de implementar

1. **Template padrão**: você tem o texto oficial do contrato de Autorização de Venda com Exclusividade para eu usar? Se não, eu monto um modelo genérico e você ajusta depois pelo admin.
2. **Comissão padrão** e **prazo padrão** (em dias)? Ex.: 6% e 180 dias.
3. **Cliente**: vincular a **Leads**, **Contas** ou aos dois? (sugiro os dois — o que vier preenchido vira o cliente do contrato)
