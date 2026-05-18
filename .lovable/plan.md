## Objetivo

Remover os parênteses de gênero (`brasileiro(a)`, `nascido(a)`, `portador(a)`, `inscrito(a)`, `domiciliado(a)`) e conjugar automaticamente em masculino/feminino conforme o sexo da pessoa.

## Mudanças

### 1. Formulário (`src/components/contratos/NovoContratoDialog.tsx`)

- Adicionar campo **Sexo** (Masculino/Feminino) para cada pessoa:
  - `c1_sexo` (contratante PF)
  - `c2_sexo` (segundo contratante, quando ativado)
  - `socio_sexo` (sócio representante PJ)
- Default: `M`.

### 2. Geração das variáveis (`submit`)

Computar, para cada parte, os 5 termos conjugados e passá-los como variáveis no `renderTemplate`:

| chave              | M               | F                |
| ------------------ | --------------- | ---------------- |
| `*_nacionalidade`  | brasileiro      | brasileira       |
| `*_nascido`        | nascido         | nascida          |
| `*_portador`       | portador        | portadora        |
| `*_inscrito`       | inscrito        | inscrita         |
| `*_domiciliado`    | domiciliado     | domiciliada      |

Prefixos: `c1_`, `c2_`, `socio_`.

Para o trecho "ambos residentes e domiciliados" (quando há `c2_nome`), gerar dinamicamente conforme combinação de sexos:
- ambos M ou misto → "ambos residentes e domiciliados"
- ambas F → "ambas residentes e domiciliadas"
Expor como `dupla_residentes` e `dupla_domiciliados` (e ajustar o template para usar essas variáveis em vez do `{{#if c2_nome}}s{{/if}}`).

### 3. Atualizar o template no banco (migração SQL)

Atualizar `contrato_templates.conteudo` do template ativo `autorizacao_venda_exclusividade`, substituindo os termos `brasileiro(a)`, `nascido(a)`, `portador(a)`, `inscrito(a)`, `domiciliado(a)` pelos novos placeholders correspondentes — por contratante (`c1_*`, `c2_*`, `socio_*`).

Trecho final esperado (PF, contratante 1):
```
{{c1_nome}}, {{c1_nacionalidade}}, {{c1_nascido}} no dia {{c1_nascimento}}, {{c1_estado_civil}}, {{c1_profissao}}, {{c1_portador}} da cédula de identidade RG nº {{c1_rg}} e {{c1_inscrito}} no CPF sob o nº {{c1_cpf}} ...
```
Análogo para `c2_*` e `socio_*`.

E o bloco final:
```
{{dupla_residentes}} e {{dupla_domiciliados}} na {{end_logradouro}} ...
```
(quando solteiro: `residente` / `domiciliado(a)` → `{{c1_residente}}` / `{{c1_domiciliado}}`)

## Sem alterações

- Banco: não há mudança de schema, apenas update no conteúdo do template.
- Backend/edge functions: nenhuma alteração.

## Validação

- Criar contrato PF com sexo F → texto sai "brasileira, nascida, portadora, inscrita, domiciliada".
- Com sexo M → "brasileiro, nascido, portador, inscrito, domiciliado".
- Adicionar 2º contratante → conjugação "ambos/ambas" correta conforme os dois sexos.
- PJ → sócio representante conjuga conforme `socio_sexo`.
