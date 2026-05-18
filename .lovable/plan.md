## Objetivo

Remover completamente a informação de **data de nascimento** da "autorização de venda com exclusividade", tanto do template gerado quanto do formulário de preenchimento.

---

## Alterações

### 1. Template do banco (`contrato_templates`)

Atualizar o conteúdo do template ativo removendo:
- `{{c1_nascido}} no dia {{c1_nascimento}}, ` da qualificação do contratante PF
- `{{c2_nascido}} no dia {{c2_nascimento}}, ` da qualificação do segundo contratante PF
- `{{socio_nascido}} no dia {{socio_nascimento}}, ` da qualificação do sócio representante PJ

**Antes:**
```
{{c1_nome}}, {{c1_nacionalidade}}, {{c1_nascido}} no dia {{c1_nascimento}}, {{c1_estado_civil}}, ...
```

**Depois:**
```
{{c1_nome}}, {{c1_nacionalidade}}, {{c1_estado_civil}}, ...
```

### 2. Formulário (`NovoContratoDialog.tsx`)

Remover os 3 campos de "Data de nascimento" do accordion "Dados do contratante":
- Campo `c1_nascimento` (contratante 1, PF)
- Campo `c2_nascimento` (segundo contratante, PF)
- Campo `socio_nascimento` (sócio representante, PJ)

### 3. Estado inicial

Remover `c1_nascimento`, `c2_nascimento` e `socio_nascimento` do objeto `empty` de estado inicial.

### 4. Variáveis de renderização (`submit`)

Remover as linhas que formatam e injetam:
- `c1_nascimento`
- `c2_nascimento`
- `socio_nascimento`

As variáveis de gênero (`{{c1_nascido}}`, `{{c2_nascido}}`, `{{socio_nascido}}`) também serão removidas do template, portanto deixam de ser necessárias (embora possam ser mantidas no código sem uso, para evitar quebra caso o template seja usado em outro contexto; a remoção do texto no template é suficiente).

---

## Sem alterações

- Schema da tabela `contratos` e `dados_partes` (campos podem continuar existindo em registros antigos).
- Outros templates de contrato (se houver).
- Variáveis de gênero `gen()` permanecem funcionando para nacionalidade, portador, inscrito, domiciliado.

## Validação

- Criar novo contrato → campo "Data de nascimento" não aparece mais no formulário.
- Gerar PDF → o trecho de qualificação não contém mais "nascido no dia X".
- Editar contrato antigo → funciona normalmente (campos antigos ficam vazios, o template já foi atualizado).