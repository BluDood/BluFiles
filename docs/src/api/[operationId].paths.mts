import { usePaths } from 'vitepress-openapi'

import spec from '../assets/openapi.json' with { type: 'json' }

export default {
  paths: () => {
    return usePaths({ spec })
      .getPathsByVerbs()
      .map(({ operationId }) => ({
        params: {
          operationId
        }
      }))
  }
}
