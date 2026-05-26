# Permitir corretor visualizar detalhes do imóvel

Hoje os cards da aba Imóveis mostram só título, cidade, código, finalidade/tipo e valor. Descrição, área, quartos, banheiros, vagas, características, endereço completo e fotos extras só aparecem dentro do **EditarImovelDialog**, que está escondido para corretor.

## Mudança

Adicionar um botão **"Ver detalhes"** (ícone `Eye`) no canto superior direito do card, **visível para todos** (inclusive corretor). Ele abre um novo dialog read-only `DetalhesImovelDialog`.

### `src/components/imoveis/DetalhesImovelDialog.tsx` (novo)

Dialog somente leitura, exibindo:
- Galeria de fotos (todas as `fotos`)
- Título, código, status, finalidade, tipo
- Endereço completo (logradouro, número, complemento, bairro, cidade/UF, CEP)
- Valor, condomínio, IPTU
- Áreas (útil, total, construída) · quartos · suítes · banheiros · vagas
- Características (chips)
- Descrição completa
- Matrícula, exclusividade (datas + observações)
- Corretor, proprietário (já mapeados na página)

Sem botões de edição. Apenas "Fechar".

### `src/pages/Imoveis.tsx`

- Importar `DetalhesImovelDialog` e adicionar estado `viewing`.
- No `Header`, adicionar `<Button … onClick={() => setViewing(i)} title="Ver detalhes"><Eye /></Button>` ao lado do botão de histórico, **sem condicional** (todos veem).
- Renderizar `<DetalhesImovelDialog imovel={viewing} … />` no final.

## Sem mudanças de banco

RLS atual já permite corretor ler todos os imóveis (`Staff sees all imoveis`). É só UI.

Confirmo?
