import { get, writable } from 'svelte/store'
import { random } from './utils.js'

export const popups = writable([])

const listeners = {}

function createPopup({
  title,
  content,
  input = {},
  select = {},
  buttons = [],
  dismissValue = false
}) {
  const popup = {
    title: title || '',
    content: content || '',
    id: random(16),
    closing: false,
    dismissValue: dismissValue,
    input: {
      enabled: input.enabled || false,
      placeholder: input.placeholder || '',
      value: input.value || '',
      readonly: input.readonly || false
    },
    select: {
      enabled: select.enabled || false,
      placeholder: select.placeholder || 'Select an option...',
      options: select.options || [],
      value: select.value || ''
    },
    buttons: buttons.map((button, i) => ({
      text: button.text || '',
      type: button.type ?? '',
      color: button.color || (i === 0 ? 'blue' : null)
    })),
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

      if (listeners[popup.id]) {
        listeners[popup.id]({
          type,
          input
        })
        delete listeners[popup.id]
      }

      setTimeout(() => {
        popups.update(po => po.filter(p => p.id !== popup.id))
      }, 200)
    }
  }

  popups.update(popups => [...popups, popup])

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
    { text: 'OK', type: true },
    { text: 'Cancel', type: false }
  ]
}) {
  const id = createPopup({ title, content, buttons })

  return new Promise(resolve => {
    listeners[id] = ({ type }) => resolve(type)
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
}) {
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
    listeners[id] = ({ type, input }) => resolve({ type, input })
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
}) {
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
    listeners[id] = ({ type, input }) => resolve({ type, input })
  })
}
