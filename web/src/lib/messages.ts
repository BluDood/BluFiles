import { writable } from 'svelte/store'
import { random } from './utils.js'

interface Message {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  content: string
  time: number
  dismissable: boolean
  closing?: boolean
  dismiss: () => void
}

export const messages = writable<Message[]>([])

export function createMessage({
  type = 'info',
  title = 'Message',
  content = '',
  time = 5000,
  dismissable = true
}: {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  content?: string
  time?: number
  dismissable?: boolean
}) {
  let timeout: NodeJS.Timeout | null = null

  const message: Partial<Message> = {
    id: random(16),
    type,
    title,
    content,
    time,
    dismissable,
    dismiss: () => {
      if (timeout) clearTimeout(timeout)
      messages.update(messages => {
        return messages.map(a => {
          if (a.id === message.id) {
            return {
              ...a,
              closing: true
            }
          }

          return a
        })
      })
      setTimeout(() => {
        messages.update(messages => messages.filter(a => a.id !== message.id))
      }, 500)
    }
  }

  messages.update(messages => [...messages, message as Message])

  if (time > 0)
    timeout = setTimeout(() => {
      message.dismiss!()
    }, time)

  return message.id
}
