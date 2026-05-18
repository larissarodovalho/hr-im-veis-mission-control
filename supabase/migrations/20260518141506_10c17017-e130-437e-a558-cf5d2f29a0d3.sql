
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS dados_partes jsonb;

UPDATE public.contrato_templates
SET conteudo = $tpl$CONTRATO DE INTERMEDIAÇÃO IMOBILIÁRIA COM CLÁUSULA DE EXCLUSIVIDADE

Pelo presente instrumento, as partes abaixo qualificadas:

{{#if pessoa_juridica}}CONTRATANTE (PARTE 01): {{pj_razao_social}}, pessoa jurídica de direito privado, devidamente inscrita no CNPJ sob nº {{pj_cnpj}}, com sede na {{pj_logradouro}} nº {{pj_numero}}, Bairro {{pj_bairro}}, no município de {{pj_cidade}}, Estado de {{pj_estado}}, CEP: {{pj_cep}}, neste ato representada por {{socio_nome}}, brasileiro(a), nascido(a) no dia {{socio_nascimento}}, {{socio_estado_civil}}, {{socio_profissao}}, portador(a) da cédula de identidade RG nº {{socio_rg}} e inscrito(a) no CPF sob o nº {{socio_cpf}}, e-mail: {{socio_email}}, telefone: {{socio_telefone}}, residente e domiciliado(a) na {{socio_endereco}}, doravante denominada CONTRATANTE; e{{else}}CONTRATANTE (PARTE 01): {{c1_nome}}, brasileiro(a), nascido(a) no dia {{c1_nascimento}}, {{c1_estado_civil}}, {{c1_profissao}}, portador(a) da cédula de identidade RG nº {{c1_rg}} e inscrito(a) no CPF sob o nº {{c1_cpf}}, e-mail: {{c1_email}}, telefone: {{c1_telefone}}{{#if c2_nome}} e {{c2_nome}}, brasileiro(a), nascido(a) no dia {{c2_nascimento}}, {{c2_estado_civil}}, {{c2_profissao}}, portador(a) da cédula de identidade RG nº {{c2_rg}} e inscrito(a) no CPF sob o nº {{c2_cpf}}, e-mail: {{c2_email}}, telefone: {{c2_telefone}}, ambos{{/if}} residente{{#if c2_nome}}s{{/if}} e domiciliado{{#if c2_nome}}s{{/if}} na {{end_logradouro}} nº {{end_numero}}, Bairro {{end_bairro}}, no município de {{end_cidade}}, Estado de {{end_estado}}, CEP: {{end_cep}}, doravante denominada CONTRATANTE; e{{/if}}

CONTRATADA (PARTE 02): HR CORRETOR DE IMÓVEIS LTDA, pessoa jurídica de direito privado, devidamente inscrita no CNPJ sob o nº 27.311.298/0001-07 e inscrita no CRECI-MT sob o nº J-18050, com sede na Avenida dos Ingás nº 2075-b, Jardim Maringá, no Município de Sinop, Estado de Mato Grosso, CEP: 78.556-246, representada por seu sócio administrador Hans Miller Emanoel Luiz Rodovalho Martins, brasileiro, casado, empresário, portador da Cédula de Identidade RG nº 19735600 SSP/MT e inscrito no CPF sob o nº 022.540.031-60 e no CRECI-MT sob o nº 7.770F, e-mail: hans@gruporodovalho.com.br, telefone: (66) 99651-5883, doravante denominada CONTRATADA.

Têm entre si, justo e contratado este instrumento, que deverá ser regido sob as seguintes cláusulas contratuais:

CLÁUSULA PRIMEIRA – Das disposições preliminares: Para fins meramente metodológicos, convencionam as partes, que, independentemente de seu gênero (masculino ou feminino) ou número (singular ou plural), a PARTE 01 será denominada de CONTRATANTE e a PARTE 02 como CONTRATADA.

Parágrafo único: Pactuam as partes que o presente instrumento é celebrado à luz dos princípios da probidade e boa-fé, consoante os princípios insertos nos artigos 112, 113, 421 e 422 do Código Civil, bem como declaram ter lido todas as condições a seguir constantes, tomando conhecimento de todos os seus termos, e que foram livremente negociadas, comprometendo-se, quando da assinatura do presente, ao seu integral cumprimento.

CLÁUSULA SEGUNDA – Do objeto e dados do(s) imóvel(is): O presente instrumento tem por finalidade a intermediação na comercialização do(s) imóvel(is) de propriedade do CONTRATANTE, descrito(s) abaixo, o(s) qual(is) o CONTRATANTE declara encontrar-se livre(s) e desembaraçado(s) de quaisquer ônus ou gravames, inclusive de natureza tributária, que possam obstar ou comprometer a sua comercialização.

Endereço completo: {{imovel_endereco}}
Lote: {{imovel_lote}}    Quadra: {{imovel_quadra}}    Área Total: {{imovel_area_total}}    Área Construída: {{imovel_area_construida}}    Matrícula nº {{imovel_matricula}}
Benfeitorias: {{imovel_benfeitorias}}
Valor de venda: {{valor}}

CLÁUSULA TERCEIRA – Do valor de intenção de venda: O CONTRATANTE manifesta sua intenção de vender o(s) imóvel(is) objeto do presente instrumento pelo valor de R$ {{valor_numero}} ({{valor_extenso}}), valor este indicado a título de intenção de venda, servindo como referência inicial para fins de divulgação, intermediação e negociação do(s) imóvel(is), não constituindo, por si só, obrigação definitiva de alienação.

Parágrafo único: O valor acima poderá ser objeto de negociação, ajuste ou alteração, mediante comum acordo entre as partes, a ser formalizado por escrito, não implicando qualquer direito adquirido à concretização da venda nas condições inicialmente indicadas. A CONTRATADA somente poderá concluir negócio por valor ou condições diversas das estipuladas no caput desta cláusula mediante aceite expresso do CONTRATANTE. Todavia, sendo a proposta apresentada rigorosamente idêntica ao valor no caput, a CONTRATADA fica expressamente autorizada a formalizar a proposta, independentemente de novo aceite do CONTRATANTE.

CLÁUSULA QUARTA – Da intermediação imobiliária e dos honorários: As partes reconhecem que a comercialização do(s) imóvel(is) objeto do presente instrumento será realizada por intermédio da CONTRATADA, devidamente inscrita no CRECI-MT sob o nº J-18050, a qual se obriga a empregar seus melhores esforços profissionais para a aproximação das partes interessadas e para a efetiva concretização do negócio.

Parágrafo primeiro: Compete à CONTRATADA promover a ampla divulgação do(s) imóvel(is), mediante publicidade em redes sociais e mídias digitais, confecção e distribuição de material publicitário, realização de visitas com potenciais interessados, investimento em estratégias de marketing e demais meios idôneos de divulgação, bem como conduzir as tratativas negociais e prestar assessoramento técnico inerente à intermediação imobiliária. Todas as atividades serão desempenhadas com diligência, transparência, boa-fé objetiva e estrita observância da legislação aplicável, inclusive das normas que regem a profissão de corretor de imóveis e das disposições do Código Civil pertinentes à corretagem.

Parágrafo segundo: As partes declaram ciência e concordância com o disposto nos artigos 725 e 726 do Código Civil, bem como na Lei nº 6.530/1978, reconhecendo que a remuneração pela intermediação imobiliária será devida ainda que sem assinatura final, se houver desistência injustificada com a obtenção do resultado útil, caracterizado pela aproximação eficaz das partes, ainda que sem assinatura final, se houver desistência injustificada, e/ou pela aceitação de proposta em conformidade com as condições estipuladas neste instrumento, ainda que o negócio não venha a se concretizar por arrependimento, desistência ou inadimplemento de qualquer das partes.

Parágrafo terceiro: Pelos serviços de intermediação ora ajustados, o CONTRATANTE pagará à CONTRATADA os honorários correspondentes a {{comissao_percentual}}% ({{comissao_extenso}}) sobre o valor total do negócio, a ser pago quando da formalização da venda do imóvel, ato da assinatura do respectivo compromisso de compra e venda, da seguinte forma: {{forma_pagamento}}.

Parágrafo quarto: Em razão da cláusula de exclusividade pactuada neste contrato, caso o(s) imóvel(is) seja(m) vendido(s), prometido(s) à venda ou negociado(s) durante a vigência do presente instrumento, ainda que por iniciativa direta do CONTRATANTE ou de terceiros, será devida à CONTRATADA a remuneração integral ajustada.

Parágrafo quinto: A comissão devida poderá ser partilhada entre a CONTRATADA e corretores por ela credenciados, conforme ajuste interno, não gerando ao CONTRATANTE qualquer obrigação adicional.

Parágrafo sexto: A atuação da CONTRATADA limita-se à intermediação imobiliária, não assumindo responsabilidades por: vícios ocultos do imóvel; passivos jurídicos, fiscais ou tributários; informações prestadas diretamente pelo CONTRATANTE que não possam ser tecnicamente verificadas; débitos ocultos; ônus reais; questões ambientais; passivos condominiais; e informações fornecidas pelo vendedor.

Parágrafo sétimo: O CONTRATANTE compromete-se a fornecer toda a documentação necessária solicitada pela CONTRATADA, bem como a prestar informações verdadeiras e completas, respondendo por eventuais omissões ou inexatidões que possam comprometer a negociação.

CLÁUSULA QUINTA – Da exclusividade de intermediação, prazo, penalidades e autorização de visitas: O CONTRATANTE concede à CONTRATADA exclusividade para a intermediação da comercialização do(s) imóvel(is) objeto do presente instrumento, pelo prazo de {{prazo_meses}} ({{prazo_meses_extenso}}) meses, contados a partir da data de assinatura deste instrumento, durante o qual o CONTRATANTE obriga-se, de forma expressa e irrevogável, a não comercializar, prometer à venda, negociar ou alienar o imóvel objeto deste contrato por meio de outro corretor, pessoa física ou jurídica, ou diretamente, sob pena de incidência da multa prevista no parágrafo quarto desta cláusula.

Parágrafo primeiro: Durante o período de exclusividade, o CONTRATANTE compromete-se a não negociar, direta ou indiretamente, a venda do(s) imóvel(is), por si, por intermédio de terceiros ou por meio de outras imobiliárias, sem a participação da CONTRATADA, praticar atos e condutas de má-fé e omitir documentos, sob pena de caracterização de quebra da exclusividade e infração contratual, podendo o CONTRATADO rescindir o presente instrumento.

Parágrafo segundo: Caso o(s) imóvel(is) seja(m) vendido(s), prometido(s) à venda, cedido(s) ou negociado(s) durante a vigência da exclusividade, ainda que por iniciativa direta do CONTRATANTE ou de terceiros, será devida à CONTRATADA a remuneração integral ajustada neste contrato, independentemente de quem tenha realizado a aproximação final das partes.

Parágrafo terceiro: A exclusividade ora pactuada não impede o CONTRATANTE de recusar propostas que não atendam ao valor ou às condições por ele previamente estabelecidas, desde que a recusa seja justificada ou formalizada, não caracterizando descumprimento contratual.

Parágrafo quarto: A quebra da exclusividade, assim considerada a venda, promessa de venda, cessão, negociação ou aceitação de proposta realizada durante a vigência deste contrato, ainda que por iniciativa direta do CONTRATANTE ou de terceiros, ensejará o pagamento, em favor da CONTRATADA, de multa compensatória correspondente a 5% (cinco por cento) sobre o valor total da proposta de compra e venda ou negociação, sem prejuízo da remuneração devida pelo resultado útil, nos termos dos artigos 725 e 726 do Código Civil e da Lei nº 6.530/1978.

Parágrafo quinto: As partes reconhecem que a multa prevista no parágrafo anterior é proporcional, razoável e compatível com os usos do mercado imobiliário, sendo pactuada de forma livre e consciente, não possuindo natureza excessiva ou abusiva.

Parágrafo sexto: O pagamento da penalidade prevista nesta cláusula não afasta nem substitui o direito da CONTRATADA à percepção dos honorários de intermediação, quando configurado o resultado útil, nem exclui a possibilidade de indenização suplementar por perdas e danos, caso comprovado prejuízo superior.

Parágrafo sétimo: Para a realização do serviço ora contratado, o CONTRATANTE autoriza a CONTRATADA a promover visitas ao(s) imóvel(is), sempre mediante aviso prévio, desde que haja potencial real de compra por parte dos interessados, condicionadas tais visitas à prévia ciência e aprovação do CONTRATANTE, observando-se a razoabilidade, a boa-fé e a preservação do imóvel, não podendo o CONTRATANTE recusar visitas de forma sistemática ou injustificada.

Parágrafo oitavo: Findo o prazo de exclusividade sem a concretização do negócio, o presente instrumento poderá ser renovado por igual período, mediante acordo expresso entre as partes, oportunidade em que será elaborado termo aditivo do presente instrumento.

CLÁUSULA SEXTA – Da proteção pós contratual: Mesmo após o término ou rescisão deste contrato de corretagem com exclusividade, o CONTRATADO fará jus à comissão integral caso o negócio seja concluído com pessoa apresentada, atendida ou vinculada à sua intermediação durante a vigência contratual, ainda que a venda ocorra sem sua participação direta.

Parágrafo único: A proteção pós-contratual vigorará pelo prazo de {{protecao_meses}} ({{protecao_meses_extenso}}) meses contados do encerramento do contrato, aplicando-se independentemente da forma de rescisão ou da participação de terceiros na conclusão do negócio.

CLÁUSULA SÉTIMA – Da desistência da proposta e seus efeitos em relação à exclusividade: Em caso de desistência da proposta de venda por qualquer das partes, após a sua formalização ou aceitação, a responsabilidade pelo pagamento dos honorários de intermediação imobiliária recairá exclusivamente sobre a parte desistente, ficando a outra parte isenta de qualquer obrigação nesse sentido.

Parágrafo primeiro: A desistência imotivada ou injustificada da proposta, ocorrida durante a vigência da cláusula de exclusividade, não elide nem afasta os efeitos da exclusividade pactuada, sendo devida à CONTRATADA as despesas obtidas com marketing, jurídico e operacional, bem como a remuneração ajustada, desde que caracterizado o resultado útil da intermediação, nos termos dos artigos 725 e 726 do Código Civil e da Lei nº 6.530/1978.

Parágrafo segundo: Caso a desistência da proposta seja utilizada como meio indireto para fraudar, contornar ou esvaziar a cláusula de exclusividade, com posterior venda, promessa de venda ou negociação do(s) imóvel(is) a terceiro apresentado direta ou indiretamente pela CONTRATADA, restará configurada quebra da exclusividade, aplicando-se, cumulativamente, a multa específica prevista na cláusula de exclusividade, sem prejuízo do pagamento integral da comissão de intermediação.

Parágrafo terceiro: A desistência justificada, devidamente comprovada e comunicada por escrito, fundada em motivo relevante e superveniente, não caracterizará infração contratual, desde que não haja resultado útil, nem aproveitamento da intermediação realizada pela CONTRATADA.

Parágrafo quarto: As penalidades previstas nesta cláusula não afastam a possibilidade de indenização suplementar por perdas e danos, caso comprovado prejuízo superior, inclusive de natureza judicial ou extrajudicial.

CLÁUSULA OITAVA – Da confidencialidade: As partes comprometem-se a manter sigilo sobre todas as informações, dados, documentos e condições comerciais obtidas em razão deste contrato, não podendo divulgá-las a terceiros, salvo por obrigação legal ou autorização expressa da outra parte.

Parágrafo único: A obrigação de confidencialidade subsistirá mesmo após o término ou rescisão do presente contrato.

CLÁUSULA NONA – Da cessão e transferência: É vedado ao CONTRATANTE ceder ou transferir, total ou parcialmente, os direitos e obrigações decorrentes deste contrato sem a prévia e expressa anuência da CONTRATADA.

CLÁUSULA DÉCIMA – Das comunicações: Todas as comunicações entre as partes relacionadas a este contrato deverão ser realizadas por escrito, inclusive por meio eletrônico (e-mail ou aplicativo de mensagens), considerando-se válidas para todos os fins de direito.

CLÁUSULA DÉCIMA PRIMEIRA – Do tratamento de dados pessoais: Em conformidade com a Lei nº 13.709 de 2.018, Lei Geral de Proteção de Dados Pessoais - LGPD, todas as partes envolvidas neste contrato autorizam expressamente o tratamento de seus dados pessoais fornecidos neste instrumento. Adicionalmente, as partes autorizam-se mutuamente a compartilhar seus dados com terceiros, sejam pessoa físicas ou jurídicas, órgãos públicos ou privados, desde que isso seja necessário para o cumprimento das cláusulas e condições estabelecidas neste contrato.

Parágrafo primeiro: É vedada a qualquer das partes subscritoras deste contrato a divulgação de dados pessoais das demais, salvo quando estritamente necessária ao cumprimento das cláusulas e condições aqui pactuadas, nos termos da Lei nº 13.709, de 14 de agosto de 2018 (Lei Geral de Proteção de Dados – LGPD). O descumprimento desta obrigação sujeitará a parte infratora às penalidades legais previstas na referida legislação.

Parágrafo segundo: O descumprimento das disposições da LGPD por qualquer das partes acarretará a aplicação das sanções legais somente quando ficar comprovada a má-fé na conduta da parte infratora. Por liberalidade, as partes acordam que não haverá imposição de penalidades em casos de erro meramente formal ou de danos que possam ser prontamente corrigidos, reparados ou retificados, sem prejuízo à parte afetada e sem imposição de ônus.

CLÁUSULA DÉCIMA SEGUNDA – Das disposições gerais: As partes contratantes celebram este contrato de forma livre e espontânea, sem quaisquer elementos de coação, pressão ou outros meios ilícitos, e declaram que todas as obrigações aqui estabelecidas foram objeto de discussão e redação comum, sendo celebrado em caráter irrevogável e irretratável, obrigando as partes e seus sucessores.

Parágrafo único: As partes declaram e concordam que, caso este instrumento seja assinado em formato eletrônico e/ou digital, a veracidade, autenticidade, integridade, validade e eficácia do presente contrato estarão devidamente reconhecidas. Este reconhecimento ocorrerá conforme o disposto no artigo 219 do Código Civil Brasileiro, no caso de o contrato adotar tal formato e/ou ser assinado pelas partes através do uso de certificados eletrônicos e/ou digitais, mesmo que não sejam emitidos pela ICP-Brasil, conforme estabelece o artigo 10, § 2º, da Medida Provisória nº 2.200-2, de 24 de agosto de 2001.

CLÁUSULA DÉCIMA TERCEIRA – Do foro de eleição: Fica eleito o foro da comarca de Sinop/MT, para dirimir quaisquer dúvidas oriundas deste contrato.

E assim, por se acharem justos e contratados, assinam de forma digital e/ou presencial o presente instrumento, perante 02 (duas) testemunhas, em 02 (duas) vias de igual teor e forma.

{{cidade_assinatura}}, {{data_assinatura}}.


CONTRATANTE:                                                CONTRATADA:


{{#if pessoa_juridica}}{{pj_razao_social}}                                          HR CORRETOR DE IMÓVEIS LTDA
CNPJ nº {{pj_cnpj}}                                          CNPJ nº 27.311.298/0001-07
Rep. por {{socio_nome}}                                       Rep. por Hans M. E. L. Rodovalho Martins
CPF nº {{socio_cpf}}                                          CPF nº 022.540.031-60{{else}}{{c1_nome}}                                                HR CORRETOR DE IMÓVEIS LTDA
CPF nº {{c1_cpf}}                                             CNPJ nº 27.311.298/0001-07
                                                              Rep. por Hans M. E. L. Rodovalho Martins
                                                              CPF nº 022.540.031-60{{/if}}


TESTEMUNHAS:


1 - ______________________________        2 - ______________________________
CPF nº _______________________            CPF nº ________________________
$tpl$,
    nome = 'Autorização de Venda com Exclusividade — Oficial',
    updated_at = now()
WHERE tipo = 'autorizacao_venda_exclusividade' AND ativo = true;
