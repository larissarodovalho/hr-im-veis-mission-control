/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'HR Imóveis'
const SITE_URL = 'https://www.hrimoveis.com'

interface ImovelItem {
  id: string
  titulo: string
  cidade?: string
  bairro?: string
  valor?: number | null
  foto?: string | null
  codigo?: string | null
  quartos?: number | null
  vagas?: number | null
  area_util?: number | null
}

interface NewsletterProps {
  assunto?: string
  manchete?: string
  corpo?: string
  imoveis?: ImovelItem[]
  preheader?: string
}

const fmtBRL = (v?: number | null) =>
  typeof v === 'number'
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : 'Sob consulta'

const Email = ({
  assunto = 'HR Imóveis · Boletim de Sinop',
  manchete = 'Boletim semanal do mercado imobiliário de Sinop',
  corpo = '',
  imoveis = [],
  preheader,
}: NewsletterProps) => {
  const preview =
    preheader ||
    (corpo ? corpo.replace(/\s+/g, ' ').slice(0, 110) : 'Atualização do mercado imobiliário de Sinop e imóveis selecionados.')
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandHeader}>
            <Text style={brandName}>HR IMÓVEIS</Text>
            <Text style={brandTagline}>Sinop · Mato Grosso</Text>
          </Section>

          <Section style={card}>
            {manchete ? <Heading style={h1}>{manchete}</Heading> : null}
            {corpo
              ? corpo.split(/\n{2,}/).map((p, i) => (
                  <Text key={i} style={text}>{p}</Text>
                ))
              : null}

            {imoveis.length > 0 && (
              <>
                <Hr style={hr} />
                <Text style={label}>Imóveis selecionados</Text>
                {imoveis.map((im) => {
                  const url = `${SITE_URL}/imovel/${im.id}`
                  const local = [im.bairro, im.cidade].filter(Boolean).join(' · ')
                  const specs = [
                    im.quartos ? `${im.quartos} quarto${im.quartos > 1 ? 's' : ''}` : null,
                    im.vagas ? `${im.vagas} vaga${im.vagas > 1 ? 's' : ''}` : null,
                    im.area_util ? `${im.area_util} m²` : null,
                  ].filter(Boolean).join(' · ')
                  const altText = `Foto do imóvel ${im.titulo}${local ? ` em ${local}` : ''}`
                  return (
                    <Section key={im.id} style={imovelCard}>
                      {im.foto ? (
                        <Img src={im.foto} alt={altText} style={imovelImg} />
                      ) : null}
                      <Text style={imovelTitulo}>{im.titulo}</Text>
                      {local ? <Text style={imovelMeta}>{local}</Text> : null}
                      {specs ? <Text style={imovelMeta}>{specs}</Text> : null}
                      <Text style={imovelPreco}>{fmtBRL(im.valor)}</Text>
                      <Text style={imovelLink}>
                        <Link href={url} style={linkStyle}>Ver detalhes do imóvel</Link>
                      </Text>
                    </Section>
                  )
                })}
              </>
            )}

            <Hr style={hr} />
            <Text style={footerNote}>
              Para falar com um corretor, responda este e-mail ou acesse{' '}
              <Link href={SITE_URL} style={linkStyle}>www.hrimoveis.com</Link>.
            </Text>
          </Section>

          <Text style={footer}>
            {SITE_NAME} — Avenida das Itaúbas, Sinop/MT.{'\n'}
            Você recebe este boletim porque se inscreveu no informativo do {SITE_NAME}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    (data?.assunto as string) || 'HR Imóveis · Boletim de Sinop',
  displayName: 'Newsletter semanal',
  previewData: {
    assunto: 'HR Imóveis · Boletim semanal de Sinop',
    manchete: 'Como está o mercado imobiliário de Sinop nesta semana',
    corpo:
      'Sinop segue com bom volume de procura por imóveis prontos para morar, especialmente nas regiões centrais e em bairros planejados como o Jardim Maringá. Imóveis de 3 quartos com vaga coberta continuam sendo os mais buscados pelas famílias que estão se mudando para a cidade.\n\nNeste boletim, nossa equipe reuniu alguns imóveis do nosso portfólio que vale a pena conhecer. Se quiser agendar uma visita ou tirar dúvidas sobre financiamento, é só responder este e-mail que um corretor entra em contato.',
    preheader: 'Panorama do mercado de Sinop e imóveis selecionados pela equipe.',
    imoveis: [
      {
        id: 'demo',
        titulo: 'Casa no Jardim Maringá',
        cidade: 'Sinop',
        bairro: 'Jardim Maringá',
        valor: 1250000,
        foto: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        codigo: 'HR-0123',
        quartos: 3,
        vagas: 2,
        area_util: 220,
      },
    ],
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '24px 12px',
  color: '#2B2A29',
}
const container = { maxWidth: '600px', margin: '0 auto' }
const brandHeader = { textAlign: 'center' as const, padding: '8px 0 24px' }
const brandName = {
  fontSize: '22px',
  letterSpacing: '0.32em',
  fontWeight: 300,
  color: '#2B2A29',
  margin: 0,
}
const brandTagline = {
  fontSize: '11px',
  letterSpacing: '0.28em',
  color: '#A8A6A2',
  margin: '6px 0 0',
}
const card = {
  backgroundColor: '#FAFAF8',
  border: '1px solid #EDEAE4',
  borderRadius: '10px',
  padding: '32px 28px',
}
const h1 = { fontSize: '22px', fontWeight: 500, color: '#2B2A29', margin: '0 0 14px' }
const text = { fontSize: '15px', color: '#3B3A38', lineHeight: '1.65', margin: '0 0 14px' }
const label = {
  fontSize: '12px',
  letterSpacing: '0.12em',
  color: '#8a8783',
  margin: '8px 0 12px',
}
const imovelCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #E5E2DC',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 14px',
}
const imovelImg = {
  width: '100%',
  maxWidth: '536px',
  height: 'auto',
  borderRadius: '6px',
  display: 'block',
  margin: '0 0 12px',
}
const imovelTitulo = { fontSize: '16px', fontWeight: 600, color: '#2B2A29', margin: '0 0 4px' }
const imovelMeta = { fontSize: '13px', color: '#6e6c68', margin: '2px 0' }
const imovelPreco = { fontSize: '17px', fontWeight: 600, color: '#2B2A29', margin: '10px 0 4px' }
const imovelLink = { fontSize: '13px', margin: '8px 0 0' }
const linkStyle = { color: '#2B2A29', textDecoration: 'underline' }
const hr = { borderColor: '#EDEAE4', margin: '22px 0' }
const footerNote = { fontSize: '13px', color: '#6e6c68', textAlign: 'center' as const, margin: 0 }
const footer = {
  fontSize: '11px',
  color: '#A8A6A2',
  margin: '22px 0 0',
  textAlign: 'center' as const,
  lineHeight: '1.5',
  whiteSpace: 'pre-line' as const,
}
