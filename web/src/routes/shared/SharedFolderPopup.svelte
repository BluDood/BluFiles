<script lang="ts">
  import { onMount } from 'svelte'

  import { page } from '$app/state'

  import { formatDate, formatBytes, req } from '$lib/utils'

  import Loader from '$components/Loader.svelte'
  import FolderView from './SharedFolderPopup.svelte'
  import FileView from './SharedFilePopup.svelte'

  let {
    id,
    onclose
  }: {
    id: string
    onclose: (reload: boolean) => void
  } = $props()

  interface Dialog {
    open: boolean
    type: 'file' | 'folder' | null
    id: string | null
  }

  let dialog: Dialog = $state({
    open: false,
    type: null,
    id: null
  })

  let closing = $state(false)
  let loading = $state(true)
  interface FolderInfo {
    id: string
    name: string
    createdAt: string
    updatedAt: string
    shareId: string | null
    files: {
      id: string
      name: string
      size: number
      mime: string
      createdAt: string
      updatedAt: string
    }[]
    folders: {
      id: string
      name: string
      createdAt: string
      updatedAt: string
    }[]
  }
  let info: FolderInfo | null = $state(null)

  interface File {
    id: string
    name: string
    size: number
    mime: string
    createdAt: string
    updatedAt: string
  }

  let files: File[] = $state([])

  function close(reload = false) {
    closing = true
    setTimeout(() => onclose(reload), 200)
  }

  async function load() {
    const id = page.url.searchParams.get('id')
    const res = await req.get(`folder/${id}`, {
      params: {
        shareId: id
      }
    })

    if (!res) return close()

    info = res.data

    loading = false
  }

  onMount(load)
</script>

<div
  class="wrapper"
  data-closing={closing}
  onmousedown={e => {
    if (e.target === e.currentTarget) close()
  }}
  role="dialog"
  tabindex="-1"
>
  {#if dialog.open}
    {#if dialog.type === 'file'}
      <FileView
        onclose={c => {
          dialog = {
            open: false,
            type: null,
            id: null
          }
          load()
        }}
        id={dialog.id!}
      />
    {:else if dialog.type === 'folder'}
      <FolderView
        onclose={c => {
          dialog = {
            open: false,
            type: null,
            id: null
          }
          load()
        }}
        id={dialog.id!}
      />
    {/if}
  {/if}
  {#if loading || !info}
    <Loader />
  {:else}
    <div class="folder">
      <div class="v-align">
        <h1>{info.name}</h1>
        <button onclick={() => close()}>
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="details">
        <span>Folder</span>
        <span>{formatDate(info.createdAt)}</span>
      </div>
      {#if info.files.length === 0 && info.folders.length === 0}
        <p class="none">No files or folders found.</p>
      {:else}
        <div class="items">
          {#each info.folders as folder}
            <button
              onclick={() =>
                (dialog = {
                  open: true,
                  type: 'folder',
                  id: folder.id
                })}
              class="item"
            >
              <p class="title">
                <span class="material-icons"> folder </span>
                {folder.name}
              </p>
              <div class="info">
                <p>{formatDate(folder.updatedAt)}</p>
              </div>
            </button>
          {/each}
          {#each info.files as file}
            <button
              onclick={() =>
                (dialog = {
                  open: true,
                  type: 'file',
                  id: file.id
                })}
              class="item"
            >
              <p class="title">
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
                {file.name}
              </p>
              <div class="info">
                <p>{formatBytes(file.size)}</p>
                <p>{formatDate(file.updatedAt)}</p>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
    transition: 200ms ease;
    animation: opacity 200ms ease;
  }

  @keyframes opacity {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .wrapper[data-closing='true'] {
    opacity: 0;
    pointer-events: none;
  }

  .folder {
    background: #111;
    padding: 10px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    animation: scale 200ms ease;
    transition: 200ms ease;
    max-height: 90%;
    max-width: 90%;
    min-width: 250px;
  }

  .folder h1 {
    font-size: 28px;
  }

  .wrapper[data-closing='true'] .folder {
    transform: scale(0.8);
  }

  @keyframes scale {
    from {
      transform: scale(0.8);
    }
    to {
      transform: scale(1);
    }
  }

  .details {
    display: flex;
    align-items: center;
  }

  .details span {
    display: flex;
    align-items: center;
    color: #aaa;
    font-size: 14px;
  }

  .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
    margin: 0 5px;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 10px 0;
  }

  .item {
    all: unset;
    padding: 10px;
    border-radius: 5px;
    transition: 200ms ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 400px;
    gap: 30px;
  }

  .item:hover {
    background: #222;
  }

  .item > p {
    font-size: 18px;
    font-weight: bold;
  }

  .item .title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .item .info {
    display: flex;
    align-items: center;
  }

  .item .info > p {
    font-size: 14px;
    color: #aaa;
  }

  .item .info > p:not(:first-child)::before {
    content: '•';
    margin: 0 5px;
  }

  .none {
    color: #aaa;
    font-size: 14px;
    text-align: center;
    margin: 10px;
  }
</style>
