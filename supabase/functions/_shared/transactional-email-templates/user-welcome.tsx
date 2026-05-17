import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'HR Imóveis'
const SITE_URL = 'https://www.hrimoveis.com'
const ENDERECO = 'Av. dos Ingás, 2075 — Jd. Maringá, Sinop/MT'
const TELEFONE = '(66) 99999-0000'
const EMAIL_CONTATO = 'contato@hrimoveis.com.br'
const HORARIO = 'Seg a Sex: 08h–18h · Sáb: 08h–12h'

interface UserWelcomeProps {
  nome?: string
  email?: string
  senha?: string
  loginUrl?: string
}

const UserWelcomeEmail = ({
  nome = 'Bem-vindo(a)',
  email = '',
  senha = '',
  loginUrl = `${SITE_URL}/app`,
}: UserWelcomeProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu acesso ao CRM {SITE_NAME} está pronto</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header de marca */}
        <Section style={brandHeader}>
          <Text style={brandName}>HR IMÓVEIS</Text>
          <Text style={brandTagline}>Sinop — Mato Grosso</Text>
        </Section>

        <Section style={card}>
          <Heading style={h1}>Olá, {nome}!</Heading>
          <Text style={text}>
            Seja bem-vindo(a) ao time <strong>{SITE_NAME}</strong>. Criamos
            seu acesso ao nosso CRM para que você possa gerenciar leads,
            imóveis e atendimentos com a equipe.
          </Text>

          <Text style={label}>SUAS CREDENCIAIS DE ACESSO</Text>
          <Section style={infoBox}>
            <Text style={infoLine}>
              <span style={infoKey}>E-mail</span>
              <br />
              <span style={infoValue}>{email}</span>
            </Text>
            <Text style={infoLine}>
              <span style={infoKey}>Senha temporária</span>
              <br />
              <span style={infoValueMono}>{senha}</span>
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '32px 0 8px' }}>
            <Button href={loginUrl} style={button}>
              Acessar o CRM
            </Button>
          </Section>

          <Text style={warn}>
            ⚠️ Por segurança, troque sua senha logo após o primeiro acesso
            em <strong>Configurações → Perfil</strong>.
          </Text>
        </Section>

        {/* Assinatura institucional */}
        <Hr style={hr} />
        <Section style={signature}>
          <Text style={signTitle}>Equipe {SITE_NAME}</Text>
          <Text style={signLine}>{ENDERECO}</Text>
          <Text style={signLine}>
            {TELEFONE} · <Link href={`mailto:${EMAIL_CONTATO}`} style={linkStyle}>{EMAIL_CONTATO}</Link>
          </Text>
          <Text style={signLine}>{HORARIO}</Text>
          <Text style={signLine}>
            <Link href={SITE_URL} style={linkStyle}>www.hrimoveis.com</Link>
          </Text>
        </Section>

        <Text style={footer}>
          Se você não esperava este e-mail, ignore esta mensagem.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: UserWelcomeEmail,
  subject: `Seu acesso ao CRM ${SITE_NAME}`,
  displayName: 'Boas-vindas — novo usuário',
  previewData: {
    nome: 'Maria Souza',
    email: 'maria@hrimoveis.com',
    senha: 'Temp1234!',
    loginUrl: 'https://www.hrimoveis.com/app',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '24px 12px',
}
const container = { maxWidth: '580px', margin: '0 auto' }
const brandHeader = {
  textAlign: 'center' as const,
  padding: '8px 0 24px',
}
const brandName = {
  fontSize: '22px',
  letterSpacing: '0.32em',
  fontWeight: 300,
  color: '#2B2A29',
  margin: 0,
}
const brandTagline = {
  fontSize: '11px',
  letterSpacing: '0.35em',
  textTransform: 'uppercase' as const,
  color: '#A8A6A2',
  margin: '6px 0 0',
}
const card = {
  backgroundColor: '#FAFAF8',
  border: '1px solid #EDEAE4',
  borderRadius: '10px',
  padding: '32px 28px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 500,
  color: '#2B2A29',
  margin: '0 0 14px',
}
const text = {
  fontSize: '15px',
  color: '#3B3A38',
  lineHeight: '1.6',
  margin: '0 0 22px',
}
const label = {
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: '#8a8783',
  margin: '4px 0 8px',
}
const infoBox = {
  backgroundColor: '#ffffff',
  border: '1px solid #E5E2DC',
  borderRadius: '8px',
  padding: '18px 20px',
  margin: '0 0 8px',
}
const infoLine = { fontSize: '14px', margin: '8px 0', lineHeight: '1.55' }
const infoKey = {
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8a8783',
}
const infoValue = { fontSize: '15px', color: '#2B2A29', fontWeight: 500 }
const infoValueMono = {
  fontFamily: 'Menlo, Consolas, monospace',
  fontSize: '15px',
  color: '#2B2A29',
  fontWeight: 600,
  letterSpacing: '0.04em',
}
const button = {
  backgroundColor: '#2B2A29',
  color: '#FEFEFE',
  padding: '14px 34px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textDecoration: 'none',
  display: 'inline-block',
}
const warn = {
  fontSize: '13px',
  color: '#8a6d00',
  backgroundColor: '#fff8e1',
  padding: '12px 14px',
  borderRadius: '6px',
  margin: '20px 0 0',
  lineHeight: '1.5',
}
const hr = { borderColor: '#EDEAE4', margin: '28px 0 18px' }
const signature = { textAlign: 'center' as const, padding: '0 8px' }
const signTitle = {
  fontSize: '12px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: '#2B2A29',
  fontWeight: 600,
  margin: '0 0 10px',
}
const signLine = {
  fontSize: '12px',
  color: '#6e6c68',
  margin: '4px 0',
  lineHeight: '1.55',
}
const linkStyle = { color: '#2B2A29', textDecoration: 'underline' }
const footer = {
  fontSize: '11px',
  color: '#A8A6A2',
  margin: '22px 0 0',
  textAlign: 'center' as const,
  lineHeight: '1.5',
}
