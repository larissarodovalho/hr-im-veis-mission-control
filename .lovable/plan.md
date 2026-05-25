# PDFs e Exclusividade no Editar Imóvel

Reorganizar o dialog **Editar Imóvel** com abas e adicionar duas novas seções: anexos PDF e período de exclusividade.

## UI

Envolver o conteúdo atual em `Tabs` com três abas:

1. **Dados** — todo o conteúdo atual (Identificação, Responsável, Valores, Áreas, Localização, Características, Fotos).
2. **Documentos (PDF)** — nova aba para anexar PDFs (matrícula, contrato, documentos diversos).
3. **Exclusividade** — nova aba para definir o período de exclusividade.

### Aba Documentos
- Upload múltiplo restrito a `application/pdf` (máx. 10 MB por arquivo).
- Lista dos PDFs já anexados com: nome do arquivo, data de upload, tamanho, botão "Abrir" (signed URL) e botão "Remover".
- Os PDFs ficam no bucket privado `imoveis-docs` (novo), em `{imovel_id}/{uuid}-{nome}.pdf`.

### Aba Exclusividade
- Campo **Data de início** (date).
- Campo **Data de vencimento** (date) — validação: deve ser posterior ao início.
- Campo opcional **Observações**.
- Banner com status calculado:
  - **Sem exclusividade** (vazio)
  - **Ativa — vence em N dias** (verde/amarelo se ≤ 30 dias)
  - **Vencida há N dias** (vermelho)
- Botão "Limpar exclusividade" para remover datas.

## Banco de dados

### Tabela `imoveis` (alterações)
- `exclusividade_inicio` date
- `exclusividade_fim` date
- `exclusividade_observacoes` text

### Nova tabela `imovel_documentos`
- `imovel_id` uuid (FK lógica)
- `nome` text (nome original do arquivo)
- `storage_path` text (caminho no bucket)
- `tamanho_bytes` int
- `mime_type` text (default `application/pdf`)
- `created_by` uuid
- `created_at` timestamptz
- RLS: SELECT/INSERT/UPDATE/DELETE seguindo o padrão atual de `imoveis` (staff vê tudo; corretor/criador do imóvel acessa os seus; admin apaga).

### Storage
- Novo bucket privado **`imoveis-docs`** (não público).
- Policies em `storage.objects`:
  - SELECT/INSERT/UPDATE/DELETE para staff (admin/gestor/marketing/corretor), apenas em arquivos cujo `imovel_id` (1ª pasta) é acessível segundo as policies de `imoveis`.
- Frontend usa `createSignedUrl` (60 min) ao abrir.

## Card "Em Exclusividade" (bônus pequeno)
- Na lista de Disponíveis, mostrar um badge "Exclusivo até dd/mm" quando houver exclusividade vigente. (Apenas badge; sem mexer em filtros.)

## Detalhes técnicos

- Migração para colunas + tabela `imovel_documentos` + bucket `imoveis-docs` + policies.
- `EditarImovelDialog.tsx` reorganizado com `Tabs/TabsList/TabsContent`.
- Novo subcomponente `ImovelDocumentosTab.tsx` para isolar a lógica de upload/listagem.
- Validação de tipo (`application/pdf`) e tamanho no upload, com `toast` de erro.
- Helpers: cálculo de status da exclusividade num util pequeno reutilizável.

## Fora de escopo
- Versionamento ou OCR dos PDFs.
- Notificação automática de vencimento da exclusividade (pode ser próxima iteração).
- Edição em massa de PDFs.
