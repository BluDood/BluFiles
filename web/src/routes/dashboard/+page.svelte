<script lang="ts">
  import { onMount } from 'svelte'

  import { req, formatBytes } from '$lib/utils'
  import { alert } from '$lib/popups'

  import Progress from '$components/Progress.svelte'

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
  }

  let info: DashboardInfo | null = $state(null)

  onMount(async () => {
    const res = await req.get('/')
    if (!res) return

    if (res.status !== 200) {
      return await alert({
        title: 'Error',
        content: 'An error has occurred while loading your dashboard.',
        buttons: [
          {
            text: 'Dismiss'
          }
        ]
      })
    }

    info = res.data
  })
</script>

{#if info}
  <main>
    <h1>Welcome, {info.user.name}!</h1>
    <div class="info">
      <button class="item" disabled>
        <h2>Storage</h2>
        <p>
          {formatBytes(info.storage.current)}{info.storage.max !== -1
            ? ` / ${formatBytes(info.storage.max)}`
            : ''}
        </p>
        {#if info.storage.max !== -1}
          <Progress max={info.storage.max} value={info.storage.current} />
        {/if}
      </button>
      <a class="item" href="/dashboard/files">
        <h2>Files</h2>
        <p>
          {info.files.current}{info.files.max !== -1
            ? ` / ${info.files.max}`
            : ''}
        </p>
        {#if info.files.max !== -1}
          <Progress max={info.files.max} value={info.files.current} />
        {/if}
        <div class="link material-icons">open_in_new</div>
      </a>
      <a class="item" href="/dashboard/files">
        <h2>Folders</h2>
        <p>
          {info.folders.current}{info.folders.max !== -1
            ? ` / ${info.folders.max}`
            : ''}
        </p>
        {#if info.folders.max !== -1}
          <Progress max={info.folders.max} value={info.folders.current} />
        {/if}
        <div class="link material-icons">open_in_new</div>
      </a>
      <a class="item" href="/dashboard/pastes">
        <h2>Pastes</h2>
        <p>
          {info.pastes.current}{info.pastes.max !== -1
            ? ` / ${info.pastes.max}`
            : ''}
        </p>
        {#if info.pastes.max !== -1}
          <Progress max={info.pastes.max} value={info.pastes.current} />
        {/if}
        <div class="link material-icons">open_in_new</div>
      </a>
      <a class="item" href="/dashboard/collections">
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
        <div class="link material-icons">open_in_new</div>
      </a>
      <a class="item" href="/dashboard/shares">
        <h2>Shared Items</h2>
        <p>
          {info.shares.current}{info.shares.max !== -1
            ? ` / ${info.shares.max}`
            : ''}
        </p>
        {#if info.shares.max !== -1}
          <Progress max={info.shares.max} value={info.shares.current} />
        {/if}
        <div class="link material-icons">open_in_new</div>
      </a>
    </div>
  </main>
{/if}

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: appear 500ms ease;
  }

  .info {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .info .item {
    all: unset;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    background: #111;
    padding: 15px;
    border-radius: 10px;
    position: relative;
    transition: 200ms ease;
    cursor: pointer;
  }

  .info .item:has(:global(.progress)) p {
    margin-bottom: 5px;
  }

  .info .item:is(:hover, :focus-visible) {
    background: #222;
  }

  .info .item:not(:has(.link)) {
    background: #111;
    cursor: default;
  }

  .info .item .link {
    position: absolute;
    top: 0;
    right: 0;
    margin: 20px;
    font-size: 20px;
  }
</style>
