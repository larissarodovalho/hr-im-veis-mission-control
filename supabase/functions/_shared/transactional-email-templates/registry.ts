/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as immediateContactAlert } from './immediate-contact-alert.tsx'
import { template as userWelcome } from './user-welcome.tsx'
import { template as newLeadAlert } from './new-lead-alert.tsx'
import { template as newsletterWeekly } from './newsletter-weekly.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'immediate-contact-alert': immediateContactAlert,
  'user-welcome': userWelcome,
  'new-lead-alert': newLeadAlert,
  'newsletter-weekly': newsletterWeekly,
}

