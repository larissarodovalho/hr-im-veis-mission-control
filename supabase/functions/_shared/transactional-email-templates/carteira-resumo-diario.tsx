import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Item {
  label: string
  value: string
}

interface Props {
  nome?: string
  papel?: string
  resumo?: Item[]
  destaques?: string[]
  url?: string
}

const Email = ({ nome, papel = 'corretor', resumo = [], destaques = [], url }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Resumo diário da sua carteira — HR Imóveis</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Resumo diário da carteira</Heading>
        <Text style={text}>
          {nome ? `Olá, ${nome}.` : 'Olá.'}{' '}
          {papel === 'gestor'
            ? 'Veja abaixo a situação das carteiras distribuídas.'
            : 'Veja abaixo as contas da sua carteira que precisam de atenção hoje.'}
        </Text>

        <Section style={card}>
          {resumo.map((r) => (
            <Text key={r.label} style={linha}>
              <span style={rotulo}>{r.label}:</span> <strong>{r.value}</strong>
            </Text>
          ))}
        </Section>

        {destaques.length > 0 && (
          <>
            <Hr style={hr} />
            <Text style={subtitulo}>Destaques</Text>
            {destaques.map((d, i) => (
              <Text key={i} style={item}>• {d}</Text>
            ))}
          </>
        )}

        {url && (
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button href={url} style={botao}>Abrir o CRM</Button>
          </Section>
        )}

        <Hr style={hr} />
        <Text style={rodape}>HR Imóveis · CRM · mensagem automática diária</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Resumo diário da carteira — HR Imóveis',
  displayName: 'Carteira — resumo diário',
  previewData: {
    nome: 'Gabriel',
    papel: 'corretor',
    resumo: [
      { label: 'Contas ativas', value: '18' },
      { label: 'Atrasadas', value: '3' },
      { label: 'Ações vencidas', value: '2' },
    ],
    destaques: ['Maria Silva — prazo vencido há 2 dias', 'João Souza — retorno agendado vencido'],
    url: 'https://royal-dashboard.lovable.app/crm/minha-carteira',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '20px', color: '#111827', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '22px' }
const card = { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '14px 16px', marginTop: '12px' }
const linha = { fontSize: '14px', color: '#111827', margin: '4px 0' }
const rotulo = { color: '#6b7280' }
const subtitulo = { fontSize: '14px', color: '#111827', fontWeight: 'bold' as const, margin: '12px 0 4px' }
const item = { fontSize: '13px', color: '#374151', margin: '2px 0' }
const botao = {
  backgroundColor: '#111827', color: '#ffffff', padding: '10px 18px',
  borderRadius: '8px', fontSize: '14px', textDecoration: 'none',
}
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const rodape = { fontSize: '11px', color: '#9ca3af' }
