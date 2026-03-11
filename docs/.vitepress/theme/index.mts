import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

import { theme, useOpenapi } from 'vitepress-openapi/client'

import 'vitepress-openapi/dist/style.css'

import spec from '../..//src/assets/openapi.json' with { type: 'json' }

export default {
  extends: DefaultTheme,
  enhanceApp: async ctx => {
    useOpenapi({
      spec,
      config: {
        server: {
          allowCustomServer: true
        }
      }
    })
    theme.enhanceApp(ctx)
  }
} as Theme
