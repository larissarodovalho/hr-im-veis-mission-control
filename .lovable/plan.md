## Objetivo

Eliminar do template os termos com parênteses de número (`imóvel(is)`, `do(s)`, `descrito(s)`, `seja(m) vendido(s)`, `prometido(s)`, etc.) e fazê-los conjugar **singular/plural** automaticamente conforme a quantidade de imóveis vinculados ao contrato.

## Estratégia

Espelhar a abordagem usada para gênero: adicionar variáveis pré-conjugadas no `submit` e atualizar o template no banco para usá-las.

### 1. Suportar 1+ imóveis no formulário

Hoje `NovoContratoDialog.tsx` aceita só **um** imóvel (`imovelId` + campos de descrição únicos: lote, quadra, área, matrícula, benfeitorias).

Mudanças:

- Trocar `imovelId: string` por `imovelIds: string[]` (multi-seleção via lista com checkbox/SearchableSelect múltiplo).
- Os campos de detalhe (lote/quadra/área/matrícula/benfeitorias) passam a ser **um bloco por imóvel selecionado** (ou só endereço quando vier do cadastro). Para manter a UI simples, na v1: para cada imóvel selecionado, mostrar um cartão com os mesmos campos atuais; "Descrição manual" continua disponível como item adicional avulso.
- Persistência: `contratos.imovel_id` continua existindo (recebe o **primeiro** imóvel para compatibilidade da listagem/relacionamentos). A lista completa vai dentro de `dados_partes.imoveis` (array) para edição posterior.

### 2. Variáveis derivadas (`submit`)

Calcular `n = imoveis.length` e expor um helper `num(s, pl)` que retorna `s` se `n === 1` ou `pl` se `n > 1`. Variáveis novas:

| chave                  | singular            | plural               |
| ---------------------- | ------------------- | -------------------- |
| `imovel_palavra`       | imóvel              | imóveis              |
| `do_imovel`            | do imóvel           | dos imóveis          |
| `o_imovel`             | o imóvel            | os imóveis           |
| `o_qual`               | o qual              | os quais             |
| `descrito_abaixo`      | descrito abaixo     | descritos abaixo     |
| `livre_desembaracado`  | livre e desembaraçado | livres e desembaraçados |
| `seja_vendido`         | seja vendido        | sejam vendidos       |
| `prometido_venda`      | prometido à venda   | prometidos à venda   |
| `cedido`               | cedido              | cedidos              |
| `negociado`            | negociado           | negociados           |
| `imoveis_bloco`        | (HTML/texto com a descrição do único imóvel) | (lista numerada dos imóveis com endereço, lote, quadra, área, matrícula, benfeitorias) |

A `imoveis_bloco` substitui o trecho atual fixo:

```
Endereço completo: {{imovel_endereco}}
Lote: ...    Quadra: ...    Área Total: ...
Benfeitorias: ...
```

Gerada no submit como string multi-linha; quando 2+ imóveis, prefixada por "Imóvel 1:", "Imóvel 2:", etc.

### 3. Atualizar template no banco (migração SQL)

Substituir no `conteudo` do template ativo:

- `do(s) imóvel(is)` → `{{do_imovel}}`
- `o(s) imóvel(is)` → `{{o_imovel}}`
- `descrito(s) abaixo` → `{{descrito_abaixo}}`
- `o(s) qual(is)` → `{{o_qual}}`
- `livre(s) e desembaraçado(s)` → `{{livre_desembaracado}}`
- `seja(m) vendido(s)` → `{{seja_vendido}}`
- `prometido(s) à venda` → `{{prometido_venda}}`
- `cedido(s)` → `{{cedido}}`
- `negociado(s)` → `{{negociado}}`
- Bloco de descrição do imóvel → `{{imoveis_bloco}}`
- Quaisquer outras ocorrências de `(s)`/`(is)`/`(m)` que aparecerem na varredura — listadas no comentário da migração.

### 4. Edição

`ContratosTab.tsx` já carrega `dados_partes`. O dialog de edição lê `dados_partes.imoveis` (array) — se não existir (contratos antigos), faz fallback para `imovel_id` único.

## Sem alterações

- Schema da tabela `contratos` (continua com `imovel_id` single; o array vive em `dados_partes`).
- Backend / edge functions / fluxo Clicksign.
- Geração de PDF / papel timbrado.

## Validação

- Contrato com **1 imóvel**: texto sai "do imóvel… o qual… descrito abaixo… seja vendido…", bloco com endereço/lote/etc. sem numeração.
- Contrato com **2+ imóveis**: "dos imóveis… os quais… descritos abaixo… sejam vendidos…", bloco listando "Imóvel 1: …", "Imóvel 2: …".
- Contrato antigo (com `imovel_id` único, sem `dados_partes.imoveis`) abre em edição sem perder dados.

## Ponto a confirmar

1. **Multi-seleção** é o esperado? Ou prefere que o contrato continue sendo **sempre um imóvel** e o template apenas use as formas no singular (descartando o plural)? A v1 acima assume multi; se for só singular, removo a UI múltipla e a migração troca tudo direto pelas formas no singular.
