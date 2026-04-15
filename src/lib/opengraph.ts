import type { Collection, File, Folder, Paste } from './prisma.js'

const baseHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url={{url}}"/>
  {{meta}}
</head>
<body>
</body>
</html>`

function generateTag(property: string[] | string, content: string) {
  if (Array.isArray(property)) {
    return property
      .map(prop => `<meta property="${prop}" content="${content}">`)
      .join('\n  ')
  }
  return `<meta property="${property}" content="${content}">`
}

function generateSharePage(metaTags: string[], shareId: string, host: string) {
  const replace = [
    ['{{meta}}', metaTags.join('\n  ')],
    ['{{url}}', `${host}/shared?id=${shareId}`]
  ]

  return replace.reduce(
    (html, [key, value]) => html.replace(key, value),
    baseHtml
  )
}

export function generateProtectedMetaPage(shareId: string, host: string) {
  const metaTags = [
    generateTag(['color', 'theme-color'], '#0064FF'),

    generateTag(['og:title', 'twitter:title'], 'Protected Share'),
    generateTag('og:url', `${host}/shared?id=${shareId}`),
    generateTag('og:site_name', 'BluFiles'),

    generateTag(
      ['description', 'twitter:description', 'og:description'],
      'The content of this share is protected by a password.'
    ),
    generateTag('twitter:card', 'summary'),
    generateTag('og:type', 'website')
  ]

  return generateSharePage(metaTags, shareId, host)
}

export function generateFileMetaPage(
  shareId: string,
  type: 'file' | 'folder' | 'collection' | 'paste',
  content: File | Folder | Collection | Paste,
  host: string
): string {
  const metaTags: string[] = [
    generateTag(['color', 'theme-color'], '#0064FF'),

    generateTag(['og:title', 'twitter:title'], content.name),
    generateTag('og:url', `${host}/shared?id=${shareId}`),
    generateTag('og:site_name', 'BluFiles')
  ]

  if (type === 'file') {
    const file = content as File

    const isVideo = file.mime.startsWith('video/')
    const isImage = file.mime.startsWith('image/')

    if (isVideo) {
      metaTags.push(
        generateTag('twitter:card', 'player'),
        generateTag('og:type', 'video.other'),
        generateTag(
          ['twitter:player', 'og:video'],
          `${host}/api/file/${file.id}/raw?shareId=${shareId}`
        ),
        generateTag('og:video:type', file.mime),
        generateTag('twitter:player:width', '1280'),
        generateTag('twitter:player:height', '720')
      )
    } else if (isImage) {
      metaTags.push(
        generateTag('twitter:card', 'summary_large_image'),
        generateTag('og:type', 'website'),
        generateTag(
          ['twitter:image', 'og:image'],
          `${host}/api/file/${file.id}/raw?shareId=${shareId}`
        )
      )
    } else {
      metaTags.push(
        generateTag(
          ['description', 'twitter:description', 'og:description'],
          `Shared file (${(Number(file.size) / 1024).toFixed(2)} KB)`
        ),
        generateTag('twitter:card', 'summary'),
        generateTag('og:type', 'website')
      )
    }
  } else if (type === 'folder') {
    // const folder = content as Folder

    metaTags.push(
      generateTag('twitter:card', 'summary'),
      generateTag('og:type', 'website'),
      generateTag(
        ['description', 'twitter:description', 'og:description'],
        `Shared folder`
      )
    )
  } else if (type === 'collection') {
    // const collection = content as Collection

    metaTags.push(
      generateTag('twitter:card', 'summary'),
      generateTag('og:type', 'website'),
      generateTag(
        ['description', 'twitter:description', 'og:description'],
        `Shared collection`
      )
    )
  } else if (type === 'paste') {
    // const paste = content as Paste

    metaTags.push(
      generateTag('twitter:card', 'summary'),
      generateTag('og:type', 'website'),
      generateTag(
        ['description', 'twitter:description', 'og:description'],
        `Shared paste`
      )
    )
  }

  return generateSharePage(metaTags, shareId, host)
}
