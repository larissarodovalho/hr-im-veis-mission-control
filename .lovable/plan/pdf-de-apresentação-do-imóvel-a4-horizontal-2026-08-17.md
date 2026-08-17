# PDF de apresentação do imóvel (A4 horizontal)

Gerar, a partir da "Apresentação para o cliente", um PDF paisagem moderno e minimalista com a identidade HR Imóveis, pronto para enviar no WhatsApp ou por e-mail.

## Onde fica o botão

- No próprio diálogo **Apresentação para o cliente**: botão "Gerar PDF" no rodapé, ao lado de "Salvar apresentação" (salva antes de gerar, para o PDF refletir o que está na tela).
- Também no menu de ações do card do imóvel (aba Imóveis), como "PDF de apresentação", usando a configuração já salva.

## O que entra no PDF

Segue exatamente a apresentação configurada:
- Somente as fotos marcadas como públicas.
- Descrição pública (ou a do cadastro, se vazia) e condições comerciais.
- Valor exibido apenas se "Exibir valor por padrão" estiver ligado.
- Localização conforme a regra escolhida (bairro+cidade / só cidade / oculto).
- Nunca inclui endereço completo, proprietário, matrícula ou dados internos.

## Estrutura (3 páginas A4 paisagem, 297x210mm)

```text
Pág. 1 — CAPA
[ foto principal ocupando ~60% da largura ] | [ faixa clara: logo HR,
                                              título do imóvel,
                                              localização, valor,
                                              chips: quartos / suítes /
                                              vagas / área ]

Pág. 2 — GALERIA
grade 2x3 de fotos com cantos suaves e legenda discreta

Pág. 3 — DETALHES
descrição pública | condições comerciais | características
rodapé: corretor (nome + WhatsApp) + HR Imóveis (site/telefone)
```

- Se houver poucas fotos, a galeria se adapta (1x2 ou 2x2) e, se não houver nenhuma, a página é omitida.
- Rodapé em todas as páginas: logo pequeno, código de referência do imóvel e numeração.

## Estilo

- Paleta do CRM: preto Rodovalho (#2B2A29), cinzas neutros e branco; um único tom de destaque para números/valor.
- Tipografia leve, muita respiração, sem molduras pesadas, sem gradientes.
- Fotos com cantos arredondados e recorte "cover" para não distorcer.

## Detalhes técnicos

- Novo `src/lib/imovelPdf.ts` usando `jsPDF` (já instalado), no mesmo padrão de `src/lib/contratos.ts`.
- Fotos carregadas via `imagemOtimizada(url, IMG_GALERIA)` e convertidas para JPEG em canvas antes do `addImage` (mantém peso do arquivo baixo, ~1-2 MB).
- Contato: nome e telefone do usuário logado (profiles) + dados institucionais de `siteSettings`.
- Nome do arquivo: `apresentacao-<codigo-ou-slug-do-titulo>.pdf`, baixado no navegador.
- Sem alterações de banco de dados nem de Edge Functions.
