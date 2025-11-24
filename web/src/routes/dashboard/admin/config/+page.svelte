<script lang="ts">
  import { req } from '$lib/utils.js'
  import { onMount } from 'svelte'

  let config: Config | null = $state(null)
  let loading = $state(true)

  interface Config {
    maxUsers: number
    disableRegistration: boolean | 'afterFirstUser'
    total: {
      maxFiles: number
      maxFolders: number
      maxPastes: number
      maxCollections: number
      maxShares: number
      maxStorage: number
    }
    user: {
      maxFiles: number
      maxFolders: number
      maxPastes: number
      maxCollections: number
      maxShares: number
      maxTokens: number
      maxStorage: number
    }
  }

  async function load() {
    loading = true
    const res = await req.get('admin/config')
    if (res.status !== 200) {
      config = null
      loading = false
      return
    }

    config = res.data
    loading = false
  }

  onMount(load)
</script>

<main>
  <div class="section">
    <h2>Configuration</h2>
  </div>
</main>

<style>
  main {
    animation: appear 500ms ease;
  }

  .section {
    background: #111;
    border-radius: 10px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
</style>
