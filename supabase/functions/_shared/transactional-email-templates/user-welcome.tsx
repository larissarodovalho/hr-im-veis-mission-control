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
  loginUrl = 'https://www.hrimoveis.com/app',
}: UserWelcomeProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu acesso ao CRM {SITE_NAME} está pronto</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Olá, {nome}!</Heading>
        <Text style={text}>
          Sua conta de acesso ao CRM <strong>{SITE_NAME}</strong> foi criada.
          Use as credenciais abaixo para fazer o primeiro login:
        </Text>

        <Section style={infoBox}>
          <Text style={infoLine}><strong>E-mail:</strong> {email}</Text>
          <Text style={infoLine}><strong>Senha temporária:</strong> {senha}</Text>
        </Section>

        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={loginUrl} style={button}>
            Acessar o CRM
          </Button>
        </Section>

        <Text style={warn}>
          ⚠️ Por segurança, troque sua senha logo após o primeiro acesso em
          Configurações → Perfil.
        </Text>

        <Text style={footer}>
          Se você não esperava este e-mail, ignore esta mensagem.
        </Text>
        <Text style={footer}>— Equipe {SITE_NAME}</Text>
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

const main = { backgroundColor: '#ffffff', fontFamily: 'Montserrat, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#2B2A29', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#2B2A29', lineHeight: '1.55', margin: '0 0 20px' }
const infoBox = {
  backgroundColor: '#F5F5F5',
  border: '1px solid #C5C6C6',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '12px 0 8px',
}
const infoLine = { fontSize: '14px', color: '#2B2A29', margin: '6px 0', lineHeight: '1.5' }
const button = {
  backgroundColor: '#2B2A29',
  color: '#FEFEFE',
  padding: '12px 28px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}
const warn = { fontSize: '13px', color: '#8a6d00', backgroundColor: '#fff8e1', padding: '10px 14px', borderRadius: '6px', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#727271', margin: '14px 0 4px', lineHeight: '1.5' }
