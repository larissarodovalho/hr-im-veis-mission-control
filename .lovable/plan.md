# Imóveis não aparecem no iPhone — correção

## Diagnóstico

No preview mobile (390×844) os cards aparecem normalmente, mas no Safari real do iPhone eles ficam invisíveis. A causa provável é o padrão de animação usado nos cards:

- Cada card é um `motion.div` com `initial={{ opacity: 0, y: ... }}` + `whileInView={{ opacity: 1, y: 0 }}`.
- Os cards são montados **depois** da resposta assíncrona do Supabase. No Safari iOS, quando um elemento já nasce dentro da viewport, o `IntersectionObserver` do framer-motion às vezes não dispara o callback inicial — principalmente combinado com `margin: "-60px"` (rootMargin negativo).
- Resultado: o card fica preso em `opacity: 0` para sempre no iPhone.

Pontos afetados:
- `src/pages/site/HomePage.tsx` → cards de "Imóveis em destaque" (linha ~291). Sem `once: true`, com `margin: "-60px"`.
- `src/pages/site/ImoveisPage.tsx` → cards do grid (linha ~373) e badges/preço dentro do card (linhas ~412, ~432).

## Plano

1. **HomePage.tsx — cards de destaque (≈ linha 291–330)**
   - Trocar `initial={{ opacity: 0, y: 50 }}` + `whileInView` pelo padrão usado nos outros lugares: `viewport={{ once: true, amount: 0.1 }}` (sem `margin` negativo). Isso garante disparo no Safari iOS mesmo quando o card já nasce dentro da viewport.

2. **ImoveisPage.tsx — card principal do grid (≈ linha 373)**
   - Substituir `viewport={{ once: true, margin: "-60px" }}` por `viewport={{ once: true, amount: 0.05 }}`.

3. **ImoveisPage.tsx — animações internas (status, preço, linhas 412 e 432)**
   - Essas dependem do mesmo observer do pai. Manter `once: true` mas adicionar `amount: 0` para garantir disparo imediato em iOS mesmo se a animação do pai falhar (defensivo).

4. **Fallback de segurança (CSS)**
   - Adicionar uma classe utilitária no card raiz garantindo `opacity: 1` após ~1.2s via animação CSS, independente do observer. Assim, mesmo que o framer-motion não dispare por algum motivo no Safari iOS, o conteúdo nunca fica invisível.

## Verificação

Depois da mudança:
- Abrir a home no preview mobile e confirmar que o card "Sobrado Alameda das Cores" aparece.
- Abrir `/imoveis` e confirmar idem.
- Pedir para você testar no iPhone real (com refresh forçado) para validar.
