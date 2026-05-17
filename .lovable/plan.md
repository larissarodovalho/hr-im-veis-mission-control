## Remover a seção "Cada detalhe pensado..." da home do site

Remover o bloco parallax full-width que mostra a frase *"Cada detalhe pensado para quem valoriza sofisticação e qualidade de vida"* na página `/site`.

### Mudança

- **Arquivo:** `src/pages/site/HomePage.tsx`
- **Linhas ~198–226:** apagar todo o `<ScrollSection>` "Full-width Parallax" (a seção inteira, incluindo a imagem de fundo `section_living`, o overlay e o título).
- Ajustar o `index` das seções seguintes se necessário (a próxima seção "Diferenciais" passa de `index={3}` para `index={2}` para manter a sequência das animações de scroll).
- A imagem `section_living` continua disponível no painel de configurações (não vou removê-la das configurações, só deixa de ser usada nessa seção específica da home).

### Fora do escopo

- Manter intactas as demais seções (hero, diferenciais, imóveis em destaque, etc.).
- Não mexer em `SobrePage` nem em outras páginas que ainda usam `section_living`.