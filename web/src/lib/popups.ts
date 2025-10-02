import { get, writable } from 'svelte/store'
import { random } from './utils.js'

export interface Popup {
  title: string
  content: string
  id: string
  closing: boolean
  dismissValue: any
  input?: {
    enabled: boolean
    placeholder: string
    value: string
    readonly: boolean
  }
  select?: {
    enabled: boolean
    placeholder: string
    options: { text: string; value: string }[]
    value: string
  }
  buttons: { text: string; type: any; color: string | null }[]
  callback: (data: { type: any; input?: string }) => void
}

export const popups = writable<Popup[]>([])

const listeners: {
  [key: string]: (data: { type: any; input?: string }) => void
} = {}

function createPopup({
  title,
  content,
  input,
  select,
  buttons,
  dismissValue = false
}: {
  title: string
  content: string
  input?: {
    enabled: boolean
    placeholder?: string
    value?: string
    readonly?: boolean
  }
  select?: {
    enabled: boolean
    placeholder?: string
    options: { text: string; value: string }[]
    value?: string
  }

  buttons?: { text: string; type?: any; color?: string | null }[]
  dismissValue?: any
}) {
  const popup: Partial<Popup> = {
    title: title || '',
    content: content || '',
    id: random(16),
    closing: false,
    dismissValue: dismissValue,
    callback: ({ type, input }) => {
      popups.update(po => {
        return po.map(p => {
          if (p.id === popup.id) {
            return {
              ...p,
              closing: true
            }
          }

          return p
        })
      })

      if (listeners[popup.id!]) {
        listeners[popup.id!]({
          type,
          input
        })
        delete listeners[popup.id!]
      }

      setTimeout(() => {
        popups.update(po => po.filter(p => p.id !== popup.id))
      }, 200)
    }
  }

  if (input && input.enabled) {
    popup.input = {
      enabled: true,
      placeholder: (input as any).placeholder || '',
      value: (input as any).value || '',
      readonly: (input as any).readonly || false
    }
  }

  if (select && select.enabled) {
    popup.select = {
      enabled: true,
      options: select.options || [],
      value: (select as any).value || '',
      placeholder: (select as any).placeholder || ''
    }
  }
  popup.buttons = buttons?.map((b, i) => ({
    text: b.text,
    type: b.type !== undefined ? b.type : i === 0 ? true : false,
    color: b.color || (i === 0 ? 'blue' : null)
  }))

  popups.update(popups => [...popups, popup as Popup])

  return popup.id
}

export function closeAll() {
  get(popups).forEach(popup => {
    popup.callback({ type: popup.dismissValue })
  })
}

export async function alert({
  title,
  content,
  buttons = [
    { text: 'OK', color: 'blue', type: true },
    { text: 'Cancel', type: false }
  ]
}: {
  title: string
  content: string
  buttons?: { text: string; type?: any; color?: string | null }[]
}): Promise<{
  type: any
}> {
  const id = createPopup({ title, content, buttons })

  return new Promise(resolve => {
    listeners[id!] = ({ type }) => resolve({ type })
  })
}

export async function prompt({
  title,
  content,
  placeholder = 'Enter a value...',
  defaultValue = '',
  readonly = false,
  buttons = [
    { text: 'OK', type: true },
    { text: 'Cancel', type: false }
  ]
}: {
  title: string
  content: string
  placeholder?: string
  defaultValue?: string
  readonly?: boolean
  buttons?: { text: string; type?: any; color?: string | null }[]
}): Promise<{ type: any; input?: string }> {
  const id = createPopup({
    title,
    content,
    input: {
      enabled: true,
      placeholder,
      value: defaultValue,
      readonly
    },
    buttons
  })

  return new Promise(resolve => {
    listeners[id!] = ({ type, input }) => resolve({ type, input })
  })
}

export async function select({
  title,
  content,
  options = [],
  defaultValue = '',
  placeholder = 'Select an option...',
  buttons = [
    { text: 'OK', type: true },
    { text: 'Cancel', type: false }
  ]
}: {
  title: string
  content: string
  options: { text: string; value: string }[]
  defaultValue?: string
  placeholder?: string
  buttons?: { text: string; type?: any; color?: string | null }[]
}): Promise<{ type: any; input?: string }> {
  const id = createPopup({
    title,
    content,
    select: {
      enabled: true,
      options,
      value: defaultValue,
      placeholder
    },
    buttons
  })

  return new Promise(resolve => {
    listeners[id!] = ({ type, input }) => resolve({ type, input })
  })
}
