<script lang="ts">
  import { onMount } from 'svelte'

  import { formatBytes, req } from '$lib/utils.js'

  import Progress from '$components/Progress.svelte'
  import Loader from '$components/Loader.svelte'

  interface DashboardInfo {
    user: {
      name: string
      id: string
    }
    storage: {
      current: number
      max: number
    }
    files: {
      current: number
      max: number
    }
    folders: {
      current: number
      max: number
    }
    pastes: {
      current: number
      max: number
    }
    collections: {
      current: number
      max: number
    }
    shares: {
      current: number
      max: number
    }
    tokens: {
      current: number
      max: number
    }
  }

  let info: DashboardInfo | null = $state(null)

  async function loadStats() {
    const res = await req.get('/admin/usage')
    if (res.status === 200) {
      info = {
        ...res.data,
        storage: {
          current: Number(res.data.storage.current),
          max: Number(res.data.storage.max)
        }
      }
    }
  }

  onMount(() => {
    loadStats()
  })
</script>

<main>
  <div class="section">
    <h2>Total Usage</h2>
    <a href="/dashboard/admin/config" class="link">Edit Limits</a>

    {#if info}
      <div class="stats">
        <div class="item">
          <h2>Storage</h2>
          <p>
            {formatBytes(info.storage.current)}{info.storage.max !== -1
              ? ` / ${formatBytes(info.storage.max)}`
              : ''}
          </p>
          {#if info.storage.max !== -1}
            <Progress max={info.storage.max} value={info.storage.current} />
          {/if}
        </div>
        <div class="item">
          <h2>Files</h2>
          <p>
            {info.files.current}{info.files.max !== -1
              ? ` / ${info.files.max}`
              : ''}
          </p>
          {#if info.files.max !== -1}
            <Progress max={info.files.max} value={info.files.current} />
          {/if}
        </div>
        <div class="item">
          <h2>Folders</h2>
          <p>
            {info.folders.current}{info.folders.max !== -1
              ? ` / ${info.folders.max}`
              : ''}
          </p>
          {#if info.folders.max !== -1}
            <Progress max={info.folders.max} value={info.folders.current} />
          {/if}
        </div>
        <div class="item">
          <h2>Pastes</h2>
          <p>
            {info.pastes.current}{info.pastes.max !== -1
              ? ` / ${info.pastes.max}`
              : ''}
          </p>
          {#if info.pastes.max !== -1}
            <Progress max={info.pastes.max} value={info.pastes.current} />
          {/if}
        </div>
        <div class="item">
          <h2>Collections</h2>
          <p>
            {info.collections.current}{info.collections.max !== -1
              ? ` / ${info.collections.max}`
              : ''}
          </p>
          {#if info.collections.max !== -1}
            <Progress
              max={info.collections.max}
              value={info.collections.current}
            />
          {/if}
        </div>
        <div class="item">
          <h2>Shared Items</h2>
          <p>
            {info.shares.current}{info.shares.max !== -1
              ? ` / ${info.shares.max}`
              : ''}
          </p>
          {#if info.shares.max !== -1}
            <Progress max={info.shares.max} value={info.shares.current} />
          {/if}
        </div>
      </div>
    {:else}
      <div class="load">
        <Loader />
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    animation: appear 500ms ease;
  }

  .link {
    all: unset;
    position: absolute;
    top: 0;
    right: 0;
    margin: 15px;
    --button-color: var(--accent);
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--button-color, var(--foreground));
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
    animation: appear 500ms ease;
  }

  .link:hover {
    opacity: 0.8;
  }

  .link:focus {
    outline-color: var(--button-color, var(--outline));
  }

  .section {
    background: var(--background-sec);
    border-radius: 10px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    max-width: 740px;
    position: relative;
  }

  .stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    animation: appear 500ms ease;
  }

  .stats .item {
    all: unset;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    background: var(--background-ter);
    padding: 15px;
    border-radius: 10px;
    position: relative;
    transition: 200ms ease;
    cursor: pointer;
  }

  .stats .item:has(:global(.progress)) p {
    margin-bottom: 5px;
  }

  .stats .item:is(:hover, :focus-visible) {
    background: var(--foreground);
  }

  .stats .item:not(:has(.link)) {
    background: var(--background-ter);
    cursor: default;
  }
</style>
