Vou corrigir a perda de foco ao digitar nos campos de Data de nascimento do formulário de contratos.

Plano:
1. Mover o componente interno `Field` para fora de `NovoContratoDialog`, mantendo a mesma aparência e comportamento.
2. Tipar o `Field` com props simples e reutilizáveis para evitar recriação do componente a cada tecla digitada.
3. Manter a máscara `DD/MM/AAAA` já existente, sem alterar regras do contrato, banco de dados ou geração do PDF.
4. Validar no formulário que o cursor permanece no campo após cada número digitado.