// Sends a registered template through Lovable's managed email API and keeps the
// app's email_send_log audit trail (sent / suppressed / failed).
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  sendTemplateEmail,
  type SendTemplateEmailOptions,
  type SendTemplateEmailResult,
} from './transactional-email-templates/send-email.ts'

let _admin: ReturnType<typeof createClient> | null = null
function admin() {
  if (!_admin) {
    _admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  }
  return _admin
}

async function log(row: Record<string, unknown>) {
  const { error } = await admin().from('email_send_log').insert(row)
  if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
}

export async function sendLoggedEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  try {
    const result = await sendTemplateEmail(templateName, to, options)
    await log({
      message_id: null,
      template_name: templateName,
      recipient_email: to,
      status: result.sent ? 'sent' : 'suppressed',
    })
    return result
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await log({
      message_id: null,
      template_name: templateName,
      recipient_email: to,
      status: 'failed',
      error_message: msg.slice(0, 1000),
    })
    throw error
  }
}
