<script lang="ts">
  import { onMount } from 'svelte'

  import { req, formatBytes, formatDate } from '$lib/utils'
  import { createMessage } from '$lib/messages.js'
  import { alert } from '$lib/popups.js'

  import Progress from '$components/Progress.svelte'
  import FileView from '$components/FileView.svelte'
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

  interface File {
    id: string
    name: string
    mime: string
    size: number
    updatedAt: string
    shareId: string | null
  }

  let info: DashboardInfo | null = $state(null)
  let files: File[] | null = $state(null)
  let previewing: string | false = $state(false)

  async function loadFiles() {
    const res = await req.get('/usage/largest')
    if (res.status === 200) {
      files = res.data
    }
  }

  async function loadStats() {
    const res = await req.get('/usage/stats')
    if (res.status === 200) {
      info = res.data
    }
  }

  async function delFile(id: string, name: string) {
    const confirmed = await alert({
      title: 'Delete File',
      content: `Are you sure you want to delete the file "${name}"?`,
      buttons: [
        {
          text: 'Delete',
          color: 'red'
        },
        {
          text: 'Cancel'
        }
      ]
    })

    if (!confirmed.type) return

    const res = await req.delete(`file/${id}`)
    if (!res) return

    if (res.status !== 204)
      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    createMessage({
      title: 'File Deleted',
      type: 'success',
      content: 'The file has been deleted successfully.'
    })

    loadStats()
    loadFiles()
  }

  onMount(() => {
    loadStats()
    loadFiles()
  })
</script>

<main>
  <h2>Usage</h2>
  {#if info}
    <div class="stats">
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
      <a class="item" href="/dashboard/sharing">
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
      <a class="item" href="/dashboard/tokens">
        <h2>Tokens</h2>
        <p>
          {info.tokens.current}{info.tokens.max !== -1
            ? ` / ${info.tokens.max}`
            : ''}
        </p>
        {#if info.tokens.max !== -1}
          <Progress max={info.tokens.max} value={info.tokens.current} />
        {/if}
        <div class="link material-icons">open_in_new</div>
      </a>
    </div>
  {:else}
    <div class="load">
      <Loader />
    </div>
  {/if}
  {#if files}
    {#if files.length !== 0}
      <h2>Largest files</h2>
      {#if previewing}
        <FileView
          id={previewing}
          onclose={(r: boolean) => {
            previewing = false
            if (r) {
              loadStats()
              loadFiles()
            }
          }}
        />
      {/if}
      <div class="files">
        {#each files as file}
          <button
            draggable="true"
            class="item"
            onclick={() => (previewing = file.id)}
            ondragstart={e => {
              if (!e.dataTransfer) return
              e.dataTransfer.setData('id', file.id)
              e.dataTransfer.setData('type', 'file')
            }}
          >
            <div class="icon">
              <span class="material-icons">
                {#if file.mime.startsWith('image')}
                  image
                {:else if file.mime.startsWith('video')}
                  movie
                {:else if file.mime.startsWith('audio')}
                  music_note
                {:else if file.mime.startsWith('text')}
                  description
                {:else}
                  insert_drive_file
                {/if}
              </span>
            </div>
            <p>{file.name}</p>
            <div class="right">
              <div class="info">
                <span>{formatDate(file.updatedAt)}</span>
                <span>{formatBytes(file.size)}</span>
              </div>
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div class="actions">
                <span
                  class="action"
                  data-color="red"
                  tabindex="0"
                  role="button"
                  onclick={e => {
                    e.stopPropagation()
                    delFile(file.id, file.name)
                  }}
                >
                  <span class="material-icons">delete</span>
                </span>
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="load">
      <Loader />
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: appear 500ms ease;
  }

  main > h2 {
    animation: appear 500ms ease;
  }

  .load {
    display: flex;
    justify-content: center;
    margin-top: 20px;
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
    background: var(--background-sec);
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
    background: var(--background-ter);
  }

  .stats .item:not(:has(.link)) {
    background: var(--background-sec);
    cursor: default;
  }

  .stats .item .link {
    position: absolute;
    top: 0;
    right: 0;
    margin: 20px;
    font-size: 20px;
  }

  .files {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-width: 1000px;
    animation: appear 500ms ease;
  }

  .files::-webkit-scrollbar-track {
    background: var(--background-sec);
  }

  .files .item {
    all: unset;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 6px;
    margin: 5px;
    cursor: pointer;
    transition: 200ms ease;
    border-radius: 5px;
  }

  .files .item p {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .files .item:not(:has(.actions button:hover)):hover {
    background: var(--background-sec);
  }

  .files .item .icon {
    display: flex;
  }

  .files .item .right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-left: 20px;
  }

  .files .item .info {
    display: flex;
    align-items: center;
    width: max-content;
  }

  .files .item .info span {
    display: flex;
    align-items: center;
    color: var(--text-sec);
    font-size: 14px;
  }

  .files .item .info span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-sec);
    margin: 0 5px;
  }

  .files .item .actions {
    display: flex;
    gap: 10px;
    width: max-content;
  }

  .files .item .actions .action {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: 200ms ease;
  }

  .files .item .actions .action[data-color='red'] {
    color: var(--red);
  }

  .files .item .actions .action span {
    font-size: 20px;
  }
</style>
