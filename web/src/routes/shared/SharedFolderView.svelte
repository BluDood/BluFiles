<script lang="ts">
  import { onMount } from 'svelte'
  import SharedFileView from './SharedFilePopup.svelte'
  import { formatBytes, formatDate, req } from '$lib/utils.js'
  import Loader from '../../components/Loader.svelte'

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
  }

  const { info: shareInfo }: Props = $props()

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
      params: {
        shareId: shareInfo.id
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
    background: #111;
    border-radius: 10px;
    padding: 20px;
    width: 100%;
  }

  .shareInfo h2 {
    font-weight: 600;
    color: #fff;
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
    color: #aaa;
    font-size: 16px;
  }

  .shareInfo .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
    margin: 0 5px;
  }

  .files {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    animation: appear 500ms ease;
    border: 1px solid #222;
    border-radius: 10px;
  }

  .titlebar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #111;
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
    background: #222;
  }

  .titlebar .actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .titlebar .actions .menuWrapper {
    position: relative;
  }

  .titlebar .actions .menuWrapper .menu {
    position: absolute;
    background: #111;
    top: 40px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    width: max-content;
    padding: 5px;
    gap: 2px;
    opacity: 0;
    pointer-events: none;
    transition: 200ms ease;
  }

  .titlebar .actions .menuWrapper:focus-within .menu {
    opacity: 1;
    pointer-events: all;
  }

  .titlebar .actions .menuWrapper .menu button {
    all: unset;
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    transition: 200ms ease;
    padding: 5px;
    border-radius: 6px;
  }

  .titlebar .actions .menuWrapper .menu button:hover {
    background: #222;
  }

  .current {
    display: flex;
    align-items: center;
    background: #000;
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
    color: #aaa;
    margin-top: 20px;
  }

  .content::-webkit-scrollbar-track {
    background: #111;
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
    background: #111;
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
    color: #aaa;
    font-size: 14px;
  }

  .content .item .info span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
    margin: 0 5px;
  }
</style>
