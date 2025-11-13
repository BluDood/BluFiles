const baseHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  {{meta}}
</head>
<body>
</body>
</html>`

export function generateOpenGraphHtml({
  title,
  description,
  imageUrl,
  url
}: {
  title: string
  description: string
  imageUrl: string
  url: string
}): string {
  const generateTag = (property: string, content: string) => {
    return `<meta property="${property}" content="${content}">`
  }

  const metaTags = [
    generateTag('og:title', title),
    generateTag('og:description', description),
    generateTag('og:type', 'website'),
    generateTag('og:image', imageUrl),
    generateTag('og:url', url),
    generateTag('og:site_name', 'BluFiles'),
    generateTag('twitter:card', 'summary_large_image'),
    generateTag('twitter:title', title),
    generateTag('twitter:description', description),
    generateTag('twitter:image', imageUrl),
    generateTag('color', '#0064FF')
  ].join('\n  ')

  return baseHtml.replace('{{meta}}', metaTags)
}
