import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'BluFiles Docs',
  description: 'Documentation for BluFiles',
  srcDir: 'src',
  appearance: 'dark',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/assets/BluFilesSquare.png',
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Reference',
        link: '/api'
      }
    ],
    sidebar: [
      {
        text: 'About BluFiles',
        items: [
          { text: 'What is BluFiles?', link: '/about' },
          { text: 'Getting Started', link: '/getting-started' },
          {
            text: 'Features',
            items: [
              {
                text: 'Files',
                link: '/features/files/'
              },
              {
                text: 'Pastes',
                link: '/features/pastes/'
              },
              {
                text: 'Collections',
                link: '/features/collections/'
              },
              {
                text: 'Sharing',
                link: '/features/sharing/'
              },
              {
                text: 'Tokens',
                link: '/features/tokens/'
              },
              {
                text: 'Usage',
                link: '/features/usage/'
              },
              {
                text: 'Administration',
                link: '/features/admin/'
              }
            ]
          }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Setting up and using an API token', link: '/api-tokens' },
          { text: 'Uploading files using the API', link: '/api-upload' }
        ]
      }
    ],
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

