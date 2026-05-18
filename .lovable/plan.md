## Problema

Hoje existem duas formas independentes de marcar "destaque", e a home só lê uma delas:

1. **Checkbox "Imóvel em destaque"** no formulário de Novo/Editar Imóvel → grava em `imoveis.destaque` (boolean).
2. **Configurações → Site → "Imóveis em destaque na home"** → grava IDs em `site_settings.featured_imoveis`.

A `HomePage` lê apenas a opção 2 (`fetchFeaturedImoveis`). Por isso o imóvel que você marcou como destaque no cadastro não aparece.

Há ainda um bug secundário no fallback da home: filtra `status = "disponivel"`, mas o banco usa `"Disponível"` (com maiúscula e acento), então o fallback também volta vazio.

## Plano

1. **Em `src/pages/site/HomePage.tsx`**, mudar a busca de destaques para:
   - Primeiro, buscar até 3 imóveis com `destaque = true` e `status = 'Disponível'`, ordenados pelo mais recente.
   - Se ainda houver vagas (menos de 3), completar com os IDs definidos em `site_settings.featured_imoveis` (sem duplicar).
   - Se mesmo assim vier vazio, fallback para os 3 imóveis disponíveis mais recentes.
   - Corrigir o filtro de status para `"Disponível"`.

2. **Em `src/components/configuracoes/SiteSettingsTab.tsx`**, ajustar o texto explicativo para deixar claro que essa lista é um complemento/override manual, já que a marcação principal vem do cadastro do imóvel (checkbox "Imóvel em destaque").

Não muda banco de dados, não mexe em CRM nem em lógica de negócio — só na leitura usada pela home.

## Resultado esperado

Marcar "Imóvel em destaque" no cadastro passa a refletir imediatamente na seção "Imóveis em destaque" da página inicial do site.
