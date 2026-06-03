import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'HR Imóveis'

interface NewLeadAlertProps {
  leadName?: string
  leadPhone?: string
  leadEmail?: string
  origem?: string
  fonte?: string
  interest?: string
  leadUrl?: string
}

const NewLeadAlertEmail = ({
  leadName = 'Novo lead',
  leadPhone = '—',
  leadEmail = '—',
  origem = '—',
  fonte = '—',
  interest = '—',
  leadUrl,
}: NewLeadAlertProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Novo lead: {leadName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={banner}>
          <Text style={bannerText}>NOVO LEAD</Text>
        </Section>

        <Heading style={h1}>{leadName} acabou de chegar</Heading>
        <Text style={text}>
          Um novo lead foi cadastrado no CRM. Confira os detalhes abaixo e entre em contato o quanto antes.
        </Text>

        <Section style={infoBox}>
          <Text style={infoLine}><strong>Nome:</strong> {leadName}</Text>
          <Text style={infoLine}><strong>Telefone:</strong> {leadPhone}</Text>
          <Text style={infoLine}><strong>E-mail:</strong> {leadEmail}</Text>
          <Text style={infoLine}><strong>Origem:</strong> {origem}</Text>
          <Text style={infoLine}><strong>Fonte:</strong> {fonte}</Text>
          <Text style={infoLine}><strong>Interesse:</strong> {interest}</Text>
        </Section>

        {leadUrl ? (
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={leadUrl} style={button}>Abrir lead no CRM</Button>
          </Section>
        ) : null}

        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewLeadAlertEmail,
  subject: (data: Record<string, any>) =>
    `Novo lead: ${data?.leadName || 'sem nome'}`,
  displayName: 'Alerta de novo lead',
  previewData: {
    leadName: 'Maria Souza',
    leadPhone: '+55 62 99999-0000',
    leadEmail: 'maria@example.com',
    origem: 'Meta Ads',
    fonte: 'Formulário Facebook',
    interest: 'Apartamento 2 quartos',
    leadUrl: 'https://example.com/leads/abc',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Montserrat, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const banner = {
  backgroundColor: '#2B2A29',
  borderRadius: '8px',
  padding: '12px 16px',
  textAlign: 'center' as const,
  marginBottom: '24px',
}
const bannerText = { color: '#FEFEFE', fontSize: '14px', fontWeight: 700, letterSpacing: '1px', margin: 0 }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#2B2A29', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#2B2A29', lineHeight: '1.55', margin: '0 0 20px' }
const infoBox = {
  backgroundColor: '#F5F5F5',
  border: '1px solid #C5C6C6',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '12px 0 8px',
}
const infoLine = { fontSize: '14px', color: '#2B2A29', margin: '4px 0', lineHeight: '1.5' }
const button = {
  backgroundColor: '#2B2A29',
  color: '#FEFEFE',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#727271', margin: '20px 0 4px', lineHeight: '1.5' }
