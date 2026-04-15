<script lang="ts">
  import { onMount } from 'svelte'

  import { formatDate, formatBytes, req } from '$lib/utils'
  import { createMessage } from '$lib/messages'
  import { shareItem } from '$lib/share.js'
  import { alert } from '$lib/popups'

  import FileView from './FileView.svelte'
  import Loader from './Loader.svelte'

  let {
    id,
    onclose
  }: {
    id: string
    onclose: (reload: boolean) => void
  } = $props()

  let previewing: string | false = $state(false)

  let closing = $state(false)
  let loading = $state(true)
  let error: string | null = $state(null)

  let shouldReload = $state(false)

  interface CollectionInfo {
    id: string
    name: string
    createdAt: string
    shareId: string | null
    files: {
      id: string
      name: string
      size: number
      mime: string
      updatedAt: string
    }[]
  }
  let info: CollectionInfo | null = $state(null)

  interface FileItem {
    id: string
    name: string
    size: string
    mime: string
    updatedAt: string
  }

  let files: FileItem[] = $state([])

  function close(reload = false) {
    closing = true
    setTimeout(() => onclose(shouldReload || reload), 200)
  }

  async function removeFile(id: string) {
    if (!info) return
    const confirmed = await alert({
      title: 'Remove File',
      content: `Are you sure you want to remove the file "${
        files.find(f => f.id === id)?.name
      }" from this collection?`,
      buttons: [
        {
          text: 'Remove',
          color: 'red'
        },
        {
          text: 'Cancel'
        }
      ]
    })
    if (!confirmed.type) return

    const filtered = info.files.map(f => f.id).filter(fid => fid !== id)
    const res = await req.patch(`collection/${info.id}`, {
      fileIds: filtered
    })
    if (!res) return
    if (res.status !== 204)
      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    createMessage({
      title: 'File removed!',
      type: 'success'
    })

    shouldReload = true

    load()
  }

  async function share() {
    const res = await shareItem({
      shareId: info?.shareId || null,
      type: 'collection',
      id: info!.id,
      name: info!.name
    })

    if (!res) return
    if (res.type === 'deleted') {
      info!.shareId = null
    } else if (res.type === 'created') {
      info!.shareId = res.shareId
    }
  }

  async function delCollection() {
    if (!info) return
    const confirmed = await alert({
      title: 'Delete Collection',
      content: `Are you sure you want to delete the collection "${info.name}"?`,
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

    const res = await req.delete(`collection/${id}`)

    if (!res) return

    createMessage({
      title: 'Collection deleted!',
      type: 'success'
    })

    close(true)
  }

  async function load() {
    const res = await req.get(`collection/${id}`)
    if (res.status !== 200) {
      if (res.status === 404) error = 'The collection was not found.'
      else error = 'Please try again later.'
      loading = false
      return
    }

    info = res.data

    files = info!.files.map(file => ({
      ...file,
      size: formatBytes(file.size),
      updatedAt: formatDate(file.updatedAt)
    }))

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
  {#if previewing}
    <FileView
      onclose={() => {
        previewing = false
        load()
      }}
      id={previewing}
    />
  {/if}
  {#if loading}
    <Loader />
  {:else if error}
    <div class="error">
      <span class="material-icons"> error_outline </span>
      <h2>An error has occurred!</h2>
      <p>{error}</p>
      <div class="buttons">
        <button onclick={() => close(true)}>
          <div class="material-icons">close</div>
          Close
        </button>
      </div>
    </div>
  {:else if info}
    <div class="collection">
      <div class="v-align">
        <h1>{info.name}</h1>
        <button onclick={() => close()}>
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="details">
        <span>Collection</span>
        <span>{formatDate(info.createdAt)}</span>
      </div>
      {#if files.length === 0}
        <p class="none">No files found.</p>
      {:else}
        <div class="items">
          {#each files as file}
            <button onclick={() => (previewing = file.id)} class="item">
              <div class="title">
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
                <p class="name">
                  {file.name}
                </p>
              </div>
              <div class="info">
                <p>{file.size}</p>
                <p>{file.updatedAt}</p>
                <div class="itemActions">
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <span
                    class="button"
                    role="button"
                    tabindex="0"
                    onclick={(e: Event) => {
                      e.stopPropagation()
                      removeFile(file.id)
                    }}
                    data-color="red"
                  >
                    <span class="material-icons">close</span>
                  </span>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
      <div class="actions">
        <button onclick={share} data-color={info.shareId ? 'blue' : 'gray'}>
          <span class="material-icons">share</span>
        </button>
        <button onclick={delCollection} data-color="red">
          <span class="material-icons">delete</span>
        </button>
      </div>
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
    z-index: 5;
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

  .collection {
    background: var(--background-sec);
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

  .collection h1 {
    font-size: 28px;
  }

  .wrapper[data-closing='true'] .collection {
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
    color: var(--text-sec);
    font-size: 14px;
  }

  .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-sec);
    margin: 0 5px;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .actions button {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .actions button[data-color='red'] {
    color: var(--red);
  }

  .actions button[data-color='gray'] {
    color: var(--text-ter);
  }

  .actions button[data-color='blue'] {
    color: var(--accent);
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 5px;
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
    min-width: 400px;
    gap: 30px;
  }

  .item:hover {
    background: var(--background-ter);
  }

  .item .title {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    overflow: hidden;
  }

  .item .title .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item .info {
    display: flex;
    align-items: center;
  }

  .item .info > p {
    font-size: 14px;
    color: var(--text-sec);
  }

  .item .info > p:not(:first-child)::before {
    content: '•';
    margin: 0 5px;
  }

  .item .itemActions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 10px;
  }

  .item .itemActions .button {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .item .itemActions .button[data-color='red'] {
    color: var(--red);
  }

  .none {
    color: var(--text-sec);
    font-size: 14px;
    text-align: center;
    margin: 20px;
  }

  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: var(--background-sec);
    padding: 20px 30px;
    border-radius: 10px;
    animation: scale 200ms ease;
    transition: 200ms ease;
  }

  .wrapper[data-closing='true'] .error {
    transform: scale(0.8);
  }

  .error > .material-icons {
    font-size: 48px;
    color: var(--red);
  }

  .error .buttons {
    display: flex;
    flex-wrap: wrap;
    margin-top: 10px;
    gap: 10px;
  }

  .error .buttons button {
    all: unset;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--accent);
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .error .buttons button:hover {
    opacity: 0.8;
  }

  .error .buttons button:focus {
    outline-color: var(--accent);
  }
</style>
