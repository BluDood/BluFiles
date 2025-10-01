import { writable } from 'svelte/store'
import { random } from './utils.js'

export const messages = writable([])

export function createMessage({
  type = 'info',
  title = 'Message',
  content = '',
  timeout = 5000,
  dismissable = true
}) {
  const message = {
    id: random(16),
    type,
    title,
    content,
    timeout,
    dismissable,
    dismiss: () => {
      clearTimeout(timeout)
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

  messages.update(messages => [...messages, message])

  timeout = setTimeout(() => {
    message.dismiss()
  }, timeout)

  return message.id
}
