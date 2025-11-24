import { writable } from 'svelte/store'

interface User {
  id: string
  username: string
  type: 'user' | 'admin'
}

export const userStore = writable<User | null>(null)
