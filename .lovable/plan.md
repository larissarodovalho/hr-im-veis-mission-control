Habilitar correção ortográfica em pt-BR nos campos de texto do CRM.

O `index.html` já está com `lang="pt-BR"`, então o navegador usa o dicionário PT-BR quando o spellcheck está ativo. Vou garantir que os componentes base do shadcn (`Input` e `Textarea`) ativem spellcheck por padrão e forcem `lang="pt-BR"` no elemento — isso cobre automaticamente todos os formulários do CRM (Leads, Contas, Visitas, Reuniões, Ligações, Imóveis, Contratos, etc.) sem precisar editar cada página.

## Mudanças

1. `src/components/ui/textarea.tsx`: adicionar defaults `spellCheck` e `lang` que podem ser sobrescritos por props:
   ```tsx
   <textarea spellCheck lang="pt-BR" {...props} />
   ```
   (props vêm depois para permitir override, mas como `spellCheck`/`lang` raramente são passados, ficam como default — uso a forma `spellCheck={props.spellCheck ?? true}` e `lang={props.lang ?? "pt-BR"}`).

2. `src/components/ui/input.tsx`: mesmo tratamento, mas apenas para tipos textuais (`text`, `search`, undefined). Para `email`, `password`, `number`, `url`, `tel`, `date`, etc. não faz sentido — manter spellcheck apenas quando `type` for textual.

Resultado: todos os `<Input>` e `<Textarea>` do app passam a mostrar sublinhado vermelho e sugestões em português do navegador, sem precisar tocar nas dezenas de formulários existentes.