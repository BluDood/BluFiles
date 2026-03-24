import { BASE_URL } from './constants.js'

interface SnippetTypeDefinition {
  key: string
  name: string
  generate: (token: string) => Promise<GeneratedSnippet> | GeneratedSnippet
}

export const snippetTypes = [
  {
    key: 'sharex',
    name: 'ShareX',
    generate: async token => {
      const template = `{
  "Version": "18.0.1",
  "Name": "BluFiles",
  "DestinationType": "ImageUploader, FileUploader",
  "RequestMethod": "POST",
  "RequestURL": "${location.protocol}//${BASE_URL}/api/file",
  "Headers": {
    "Authorization": "token ${token}"
  },
  "Body": "MultipartFormData",
  "Arguments": {
    "name": "{filename}",
    "share": "true"
  },
  "FileFormName": "data",
  "URL": "${location.protocol}//${BASE_URL}/s/{json:shareId}"
}`

      return {
        snippet: template,
        language: 'json'
      }
    }
  },

  {
    key: 'curl',
    name: 'cURL',
    generate: async token => {
      const template = `curl -X POST "${location.protocol}//${BASE_URL}/api/file" \\
  -H "Authorization: token ${token}" \\
  -F "name=filename.txt" \\
  -F "share=true" \\
  -F "data=@/path/to/file.txt"`

      return {
        snippet: template,
        language: 'shell'
      }
    }
  }
] as const satisfies SnippetTypeDefinition[]

export interface GeneratedSnippet {
  snippet: string
  language: string
}

export type SnippetType = (typeof snippetTypes)[number]['key']

export async function generateSnippet(
  type: SnippetType,
  token: string
): Promise<GeneratedSnippet> {
  const generator = snippetTypes.find(t => t.key === type)
  if (!generator) {
    throw new Error('Invalid snippet type')
  }

  return await generator.generate(token)
}
