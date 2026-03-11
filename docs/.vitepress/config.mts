import { defineConfig } from 'vitepress'
import { useSidebar } from 'vitepress-openapi'

import spec from '../src/assets/openapi.json' with { type: 'json' }

const sidebar = useSidebar({
  spec
})

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'BluFiles Docs',
  description: 'Documentation for BluFiles',
  srcDir: 'src',
  appearance: 'dark',
  head: [['link', { rel: 'icon', href: '/assets/BluFilesSquare.png' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/assets/BluFilesSquare.png',
    nav: [
      { text: 'Guide', link: '/guide/about/', activeMatch: '^/guide/*' },
      {
        text: 'API Reference',
        link: '/api/',
        activeMatch: '^/api/*'
      }
    ],
    sidebar: {
      '/guide': [
        {
          text: 'About BluFiles',
          items: [
            { text: 'What is BluFiles?', link: '/guide/about/' },
            { text: 'Getting Started', link: '/guide/getting-started/' },
            {
              text: 'Features',
              items: [
                {
                  text: 'Files',
                  link: '/guide/features/files/'
                },
                {
                  text: 'Pastes',
                  link: '/guide/features/pastes/'
                },
                {
                  text: 'Collections',
                  link: '/guide/features/collections/'
                },
                {
                  text: 'Sharing',
                  link: '/guide/features/sharing/'
                },
                {
                  text: 'Tokens',
                  link: '/guide/features/tokens/'
                },
                {
                  text: 'Usage',
                  link: '/guide/features/usage/'
                },
                {
                  text: 'Profile',
                  link: '/guide/features/profile/'
                },
                {
                  text: 'Settings',
                  link: '/guide/features/settings/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Password',
                      link: '/guide/features/settings/password/'
                    },
                    {
                      text: 'Danger Zone',
                      link: '/guide/features/settings/danger/'
                    }
                  ]
                },
                {
                  text: 'Administration',
                  link: '/guide/features/admin/',
                  collapsed: true,
                  items: [
                    {
                      text: 'User Management',
                      link: '/guide/features/admin/users/'
                    },
                    {
                      text: 'Usage Stats',
                      link: '/guide/features/admin/usage/'
                    },
                    {
                      text: 'Configuration',
                      link: '/guide/features/admin/config/'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'Guides',
          items: [
            {
              text: 'Setting up and using an API token',
              link: '/guide/api-tokens/'
            },
            {
              text: 'Uploading files using the API',
              link: '/guide/api-upload/'
            }
          ]
        }
      ],
      '/api': [
        {
          text: 'API Reference',
          items: [
            {
              text: 'Specification',
              link: '/api/'
            },
            ...sidebar
              .itemsByPaths({
                linkPrefix: '/api/'
              })[0]
              .items!.map(group => ({
                ...group,
                collapsed: true
              }))
          ]
        }
      ]
    },
    outline: { level: [2, 3] },
    externalLinkIcon: true,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/BluDood/BluFiles' }
    ],
    search: {
      provider: 'local'
    }
  }
})

