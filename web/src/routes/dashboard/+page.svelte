<script lang="ts">
  import { onMount } from 'svelte'
  import { req, formatBytes } from '$lib/utils'
  import { alert } from '$lib/popups'

  interface DashboardInfo {
    user: {
      name: string
      email: string
    }
    storage: {
      used: number
      total: number
    }
    files: number
    folders: number
    pastes: number
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
          {formatBytes(info.storage.used)}{info.storage.total !== -1
            ? ` / ${formatBytes(info.storage.total)}`
            : ''}
        </p>
        {#if info.storage.total !== -1}
          <progress max={info.storage.total} value={info.storage.used}
          ></progress>
        {/if}
      </button>
      <a class="item" href="/dashboard/files">
        <h2>Files</h2>
        <p>{info.files}</p>
        <div class="link material-icons">open_in_new</div>
      </a>
      <a class="item" href="/dashboard/files">
        <h2>Folders</h2>
        <p>{info.folders}</p>
        <div class="link material-icons">open_in_new</div>
      </a>
      <a class="item" href="/dashboard/pastes">
        <h2>Pastes</h2>
        <p>{info.pastes}</p>
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

  .info .item:is(:hover, :focus-visible) {
    background: #222;
  }

  .info .item:not(:has(.link)) {
    background: #111;
    cursor: default;
  }

  .info .item progress {
    width: 100%;
  }

  .info .item .link {
    position: absolute;
    top: 0;
    right: 0;
    margin: 20px;
    font-size: 20px;
  }
</style>
