## Reordenar coluna "Contato estabelecido" no Kanban

Mover a coluna **"Contato estabelecido"** de entre "Contatado" e "Sem retorno" para entre "Sem retorno" e "Reunião".

### Ordem atual
```
A contatar → Contatado → Contato estabelecido → Sem retorno → Reunião → ...
```

### Nova ordem
```
A contatar → Contatado → Sem retorno → Contato estabelecido → Reunião → ...
```

### Mudança técnica
No arquivo `src/lib/contasFunil.ts`, reposicionar o objeto `contato_estabelecido` no array `ETAPAS` para depois de `sem_retorno` e antes de `reuniao`.
