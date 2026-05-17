## Painel "Site" em Configurações para gerenciar imagens

Adicionar uma aba **Site** dentro de `/app/configuracoes` onde você controla as imagens que aparecem no site público (`/site`), sem depender de mim para trocar nada.

### O que você vai poder fazer

1. **Fundo do Hero (capa)** — uma imagem por página: Início, Imóveis e Contato.
2. **Fundos das seções internas** — as imagens "living", "community" e "interior" usadas em Início e Sobre.
3. **Imóveis em destaque na home** — escolher até 3 imóveis já cadastrados em `/app/imoveis` para aparecer nos cards da home (puxando o título, cidade, valor e a 1ª foto do próprio imóvel).

Para cada item: pré-visualização atual, botão **Trocar imagem** (upload direto) e **Restaurar padrão**.

### Como vai funcionar por baixo

- Nova tabela `site_settings` (key/value) guardando as URLs das imagens e a lista de IDs de imóveis em destaque.
- Novo bucket público `site-assets` no storage para receber os uploads.
- Páginas `HomePage`, `ImoveisPage`, `SobrePage`, `ContatoPage` deixam de importar JPGs fixos e passam a buscar de `site_settings`, com **fallback** nas imagens atuais caso nada esteja configurado (o site nunca quebra).
- Leitura pública (qualquer visitante do site enxerga), escrita apenas para admin/gestor (RLS).

### Estrutura

```text
/app/configuracoes
   └── aba "Site"
        ├── Hero — Início / Imóveis / Contato     [upload | restaurar]
        ├── Seções — Living / Community / Interior [upload | restaurar]
        └── Imóveis em destaque                    [selector dos imóveis do CRM]
```

### Fora do escopo (posso fazer depois se quiser)

- Trocar a logo do topo/rodapé.
- Editar textos das páginas do site.
- Trocar as imagens estáticas da página `/site/imoveis` (a listagem completa) — hoje ela usa fotos fixas; o ideal é, num próximo passo, ela também puxar de `/app/imoveis`.