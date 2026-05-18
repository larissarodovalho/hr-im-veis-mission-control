UPDATE public.contrato_templates SET conteudo =
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    conteudo,
    ', brasileiro(a), nascido(a) no dia {{socio_nascimento}}',
    ', {{socio_nacionalidade}}, {{socio_nascido}} no dia {{socio_nascimento}}'),
    'portador(a) da cédula de identidade RG nº {{socio_rg}} e inscrito(a) no CPF sob o nº {{socio_cpf}}',
    '{{socio_portador}} da cédula de identidade RG nº {{socio_rg}} e {{socio_inscrito}} no CPF sob o nº {{socio_cpf}}'),
    'residente e domiciliado(a) na {{socio_endereco}}',
    'residente e {{socio_domiciliado}} na {{socio_endereco}}'),
    ', brasileiro(a), nascido(a) no dia {{c1_nascimento}}',
    ', {{c1_nacionalidade}}, {{c1_nascido}} no dia {{c1_nascimento}}'),
    'portador(a) da cédula de identidade RG nº {{c1_rg}} e inscrito(a) no CPF sob o nº {{c1_cpf}}',
    '{{c1_portador}} da cédula de identidade RG nº {{c1_rg}} e {{c1_inscrito}} no CPF sob o nº {{c1_cpf}}'),
    ', brasileiro(a), nascido(a) no dia {{c2_nascimento}}',
    ', {{c2_nacionalidade}}, {{c2_nascido}} no dia {{c2_nascimento}}'),
    'portador(a) da cédula de identidade RG nº {{c2_rg}} e inscrito(a) no CPF sob o nº {{c2_cpf}}',
    '{{c2_portador}} da cédula de identidade RG nº {{c2_rg}} e {{c2_inscrito}} no CPF sob o nº {{c2_cpf}}'),
    ', ambos{{/if}} residente{{#if c2_nome}}s{{/if}} e domiciliado{{#if c2_nome}}s{{/if}} na {{end_logradouro}}',
    '{{/if}} {{residentes_prefixo}}{{residente_palavra}} e {{domiciliado_palavra}} na {{end_logradouro}}'),
    'brasileiro(a)', '{{c1_nacionalidade}}'),
    'nascido(a)', '{{c1_nascido}}'),
    'portador(a)', '{{c1_portador}}'),
    'inscrito(a)', '{{c1_inscrito}}')
WHERE tipo = 'autorizacao_venda_exclusividade' AND ativo = true;