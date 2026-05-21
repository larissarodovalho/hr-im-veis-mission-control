## Adicionar campos no cadastro/edição de imóvel

Adicionar 3 novos campos ao imóvel: **corretor captador**, **corretor parceiro** e **número da matrícula** (informação interna).

### 1. Banco de dados

Migration em `public.imoveis`:
- `corretor_captador_id` (uuid) — perfil interno (profiles.user_id) que captou o imóvel.
- `corretor_parceiro_id` (uuid) — referência a `corretores_parceiros.id` (parceiro externo, mesma lista usada em Nova Venda).
- `matricula` (text) — número da matrícula do imóvel no cartório (uso interno).

Sem alteração em RLS (herda das policies existentes).

### 2. Frontend

**`ResponsavelProprietarioSection.tsx`** — estender props e UI:
- Novas props: `captadorId`, `onCaptadorChange`, `parceiroId`, `onParceiroChange`.
- Carregar lista de `corretores_parceiros` (ativos).
- Adicionar 2 novos selects no grid: "Corretor captador" (lista de profiles, igual ao responsável) e "Corretor parceiro" (SearchableSelect de corretores_parceiros, com opção "Nenhum").

**`EditarImovelDialog.tsx`**:
- Adicionar estados `captadorId`, `parceiroId`, `matricula`.
- Hidratar a partir do imóvel no `useEffect`.
- Passar props novas para `ResponsavelProprietarioSection`.
- Adicionar campo "Matrícula (uso interno)" na seção **Identificação** (input texto).
- Incluir os 3 campos no `update`.

**`NovoImovelDialog.tsx`**:
- Espelhar as mesmas adições (estados, props na seção, campo matrícula no form, salvar no insert).

### 3. UX

- Matrícula fica em campo único de texto livre, ao lado/abaixo da descrição na seção Identificação, marcado como "uso interno".
- Captador e parceiro são opcionais. Parceiro abre rapidinho para criar novo via fluxo já existente em Parceiros (não embutimos botão "novo parceiro" aqui nessa iteração — usuário cadastra em Imóveis > Parceiros).

### 4. Out of scope

- Mostrar captador/parceiro/matrícula nas listagens públicas/cards de imóvel.
- Validação de matrícula única.
- Botão "novo parceiro" inline no dialog de imóvel.
