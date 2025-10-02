import type { AxiosRequestConfig as OriginalAxiosRequestConfig } from 'axios'

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

declare module 'axios' {
  interface AxiosRequestConfig extends OriginalAxiosRequestConfig {
    no401Redirect?: boolean
  }
}

export {}
