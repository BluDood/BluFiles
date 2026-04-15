<script lang="ts">
  import { onMount } from 'svelte'

  import { formatBytes, formatDate, req } from '$lib/utils.js'

  import SharedFileView from './SharedFilePopup.svelte'
  import Loader from '$components/Loader.svelte'

  interface Props {
    info: {
      id: string
      ownerId: string
      type: 'folder'
      views: number
      createdAt: string
      folder: {
        id: string
        name: string
        itemCount: number
      }
    }
    password?: string
  }

  const { info: shareInfo, password }: Props = $props()

  interface FolderInfo {
    id: string
    name: string
    parentId: string | null
    files: {
      id: string
      name: string
      mime: string
      size: number
      updatedAt: string
      shareId: string | null
    }[]
    folders: {
      id: string
      name: string
      updatedAt: string
      shareId: string | null
    }[]
  }

  let loading = $state(false)
  let info: FolderInfo | null = $state(null)
  let previewing: string | false = $state(false)

  async function load(id: string | null = null) {
    info = null
    loading = true

    const res = await req.get(`folder/${id || shareInfo.folder.id}`, {
      headers: {
        'x-share-id': shareInfo.id,
        'x-share-password': password
      }
    })
    if (!res) return

    info = res.data
    loading = false
  }

  async function reload() {
    load(info?.id)
  }

  onMount(load)
</script>

<div class="folder">
  <div class="shareInfo">
    <h2>{shareInfo.folder.name}</h2>
    <div class="details">
      <span>Folder</span>
      <span>{shareInfo.views} view{shareInfo.views === 1 ? '' : 's'}</span>
      <span>{formatDate(shareInfo.createdAt)}</span>
    </div>
  </div>
  <div class="files">
    {#if previewing}
      <SharedFileView
        id={previewing}
        shareInfo={{
          id: shareInfo.id,
          password
        }}
        onclose={(r: boolean) => {
          previewing = false
          if (r) reload()
        }}
      />
    {/if}
    <div class="titlebar">
      <div class="actions">
        <!-- <button>
          <span class="material-icons">arrow_back</span>
        </button>
        <button>
          <span class="material-icons">arrow_forward</span>
        </button> -->
        <button
          disabled={loading || info?.id === shareInfo.folder.id}
          onclick={() => load(info?.parentId)}
        >
          <span class="material-icons">arrow_upward</span>
        </button>
        <button disabled={loading} onclick={reload}>
          <span class="material-icons">refresh</span>
        </button>
        <button disabled={loading || !info?.id} onclick={() => load(null)}>
          <span class="material-icons">home</span>
        </button>
      </div>
      <div class="current">{info?.name || ''}</div>
    </div>
    {#if loading}
      <div class="loading">
        <Loader />
      </div>
    {:else if info}
      <div class="content">
        {#if info.folders.length === 0 && info.files.length === 0}
          <div class="empty">
            No files or folders here. Press + to add some!
          </div>
        {:else}
          {#each info.folders as folder}
            <button
              draggable="true"
              onclick={() => load(folder.id)}
              class="item"
            >
              <div class="icon">
                <span class="material-icons">folder</span>
              </div>
              <p>{folder.name}</p>
              <div class="right">
                <div class="info">
                  <span>{formatDate(folder.updatedAt)}</span>
                </div>
              </div>
            </button>
          {/each}
          {#each info.files as file}
            <button
              draggable="true"
              class="item"
              onclick={() => (previewing = file.id)}
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
              </div>
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .folder {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    height: 100%;
    animation: appear 500ms ease;
  }

  .shareInfo {
    background: var(--background-sec);
    border-radius: 10px;
    padding: 20px;
    width: 100%;
  }

  .shareInfo h2 {
    font-weight: 600;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
    flex: 1;
  }

  .shareInfo .details {
    display: flex;
    align-items: center;
  }

  .shareInfo .details span {
    display: flex;
    align-items: center;
    color: var(--text-sec);
    font-size: 16px;
  }

  .shareInfo .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-sec);
    margin: 0 5px;
  }

  .files {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    animation: appear 500ms ease;
    border: 1px solid var(--border);
    overflow: hidden;
    border-radius: 10px;
  }

  .titlebar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--background-sec);
    padding: 5px 10px;
  }

  .titlebar .actions {
    display: flex;
    gap: 2px;
  }

  .titlebar .actions button {
    all: unset;
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    transition: 200ms ease;
    border-radius: 50%;
    padding: 5px;
  }

  .titlebar .actions button:hover {
    background: var(--background-ter);
  }

  .titlebar .actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .current {
    display: flex;
    align-items: center;
    background: var(--background);
    flex: 1;
    padding: 0 10px;
    border-radius: 5px;
    height: 30px;
    user-select: text;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    animation: fade 500ms ease;
  }

  .content {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    animation: appear 500ms ease;
  }

  .content .empty {
    display: flex;
    justify-content: center;
    color: var(--text-sec);
    margin-top: 20px;
  }

  .content::-webkit-scrollbar-track {
    background: var(--background-sec);
  }

  .content .item {
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

  .content .item p {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .content .item:not(:has(.actions button:hover)):hover {
    background: var(--background-sec);
  }

  .content .item .icon {
    display: flex;
  }

  .content .item .right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-left: 20px;
  }

  .content .item .info {
    display: flex;
    align-items: center;
    width: max-content;
  }

  .content .item .info span {
    display: flex;
    align-items: center;
    color: var(--text-sec);
    font-size: 14px;
  }

  .content .item .info span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-sec);
    margin: 0 5px;
  }
</style>
