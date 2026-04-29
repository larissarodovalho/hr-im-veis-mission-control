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

interface ImmediateContactAlertProps {
  leadName?: string
  leadPhone?: string
  interest?: string
  contactKind?: string
  leadUrl?: string
}

const KIND_LABELS: Record<string, string> = {
  videochamada: 'Videochamada',
  presencial: 'Reunião presencial',
  ligacao: 'Ligação telefônica',
  whatsapp: 'WhatsApp',
}

const ImmediateContactAlertEmail = ({
  leadName = 'Novo lead',
  leadPhone = '—',
  interest = '—',
  contactKind = 'whatsapp',
  leadUrl,
}: ImmediateContactAlertProps) => {
  const kindLabel = KIND_LABELS[contactKind] || contactKind
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>🔥 {leadName} quer contato AGORA via {kindLabel}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={alertBanner}>
            <Text style={alertText}>🔥 CONTATO IMEDIATO</Text>
          </Section>

          <Heading style={h1}>{leadName} quer falar agora</Heading>
          <Text style={text}>
            Um lead acabou de pedir contato imediato pela Sofia. Forma de contato preferida:{' '}
            <strong>{kindLabel}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLine}><strong>Nome:</strong> {leadName}</Text>
            <Text style={infoLine}><strong>Telefone:</strong> {leadPhone}</Text>
            <Text style={infoLine}><strong>Interesse:</strong> {interest}</Text>
            <Text style={infoLine}><strong>Forma de contato:</strong> {kindLabel}</Text>
          </Section>

          {leadUrl ? (
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button href={leadUrl} style={button}>
                Abrir lead no CRM
              </Button>
            </Section>
          ) : null}

          <Text style={footer}>
            Responda o quanto antes — a Sofia já avisou o lead que você entrará em contato agora mesmo.
          </Text>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ImmediateContactAlertEmail,
  subject: (data: Record<string, any>) =>
    `🔥 Contato imediato — ${data?.leadName || 'novo lead'} (${KIND_LABELS[data?.contactKind] || data?.contactKind || 'WhatsApp'})`,
  displayName: 'Alerta de contato imediato',
  previewData: {
    leadName: 'João Silva',
    leadPhone: '+55 11 99999-0000',
    interest: 'Casa 3 quartos em Goiânia',
    contactKind: 'ligacao',
    leadUrl: 'https://example.com/leads/abc',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Montserrat, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const alertBanner = {
  backgroundColor: '#2B2A29',
  borderRadius: '8px',
  padding: '12px 16px',
  textAlign: 'center' as const,
  marginBottom: '24px',
}
const alertText = { color: '#FEFEFE', fontSize: '14px', fontWeight: 700, letterSpacing: '1px', margin: 0 }
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
