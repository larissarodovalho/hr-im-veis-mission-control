Adicionar uma seção "Histórico de interações" na página da conta (`AccountDetail.tsx`) onde o corretor registra livremente reuniões, ligações, interesses demonstrados e quaisquer outras interações com aquele cliente — tudo fica salvo e listado em ordem cronológica.

A tabela `interacoes` já existe no banco e já suporta `conta_id`, `tipo`, `descricao`, `agendado_para`, `proxima_acao`, `created_by`, `created_at` — nenhuma migração necessária.

## Onde aparece

Nova `<Card>` em `src/pages/AccountDetail.tsx`, posicionada logo abaixo de "Propriedades / Negócios" e antes do bloco de Endereço/Observações.

## O que terá a caixa

1. **Formulário de novo registro** (inline no topo da seção):
   - Select **Tipo**: Reunião, Ligação, WhatsApp, Email, Visita, Interesse demonstrado, Nota/Outro
   - Textarea **Descrição** (livre, multi-linha — "escrever todas as interações")
   - Botão **Registrar**

2. **Linha do tempo (timeline)** abaixo do formulário:
   - Lista todas as interações da conta ordenadas da mais recente para a mais antiga
   - Cada item mostra: ícone do tipo + badge do tipo, data/hora formatada (pt-BR), nome do autor (via `profiles`), descrição com quebras de linha preservadas
   - Botão de excluir (lixeira) apenas para o autor ou admin/gestor
   - Estado vazio: "Nenhuma interação registrada ainda."

## Fluxo de dados

- Carregar `interacoes` onde `conta_id = id` em paralelo com os demais selects do `load()`, junto com `profiles` (nome dos autores)
- Ao registrar: `insert` em `interacoes` com `conta_id`, `tipo`, `descricao`, `created_by = auth.uid()` → recarregar lista
- Ao excluir: `delete` por id (RLS já garante autor/admin)

## Detalhes técnicos

- Novo componente `src/components/contas/ContaInteracoesTimeline.tsx` recebendo `contaId: string` para manter `AccountDetail.tsx` enxuto
- Usa `supabase`, `Card`, `Button`, `Select`, `Textarea`, `Badge`, ícones de `lucide-react` (Phone, Calendar, MessageCircle, Mail, MapPin, Star, StickyNote)
- Realtime opcional via canal `postgres_changes` na tabela `interacoes` filtrado por `conta_id` para refletir mudanças automaticamente

## Fora do escopo

- Agendamento real de reuniões/ligações (continua em `reunioes`/`ligacoes`)
- Edição de uma interação já registrada (somente criar/excluir nesta primeira versão)