<script lang="ts">
  import { onMount } from 'svelte'

  import { formatBytes, formatDate, req } from '$lib/utils.js'

  import SharedFileView from './SharedFilePopup.svelte'
  import Loader from '$components/Loader.svelte'

  interface Props {
    info: {
      id: string
      ownerId: string
      type: 'collection'
      views: number
      createdAt: string
      collection: {
        id: string
        name: string
        itemCount: number
      }
    }
  }

  const { info: shareInfo }: Props = $props()

  interface CollectionInfo {
    id: string
    name: string
    createdAt: string
    shareId: string | null
    files: FileItem[]
  }

  interface FileItem {
    id: string
    name: string
    size: number
    mime: string
    updatedAt: string
  }

  let loading = $state(false)
  let info: CollectionInfo | null = $state(null)
  let previewing: string | false = $state(false)

  async function load(id: string | null = null) {
    info = null
    loading = true

    const res = await req.get(`collection/${id || shareInfo.collection.id}`, {
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

<div class="collection">
  {#if previewing}
    <SharedFileView
      id={previewing}
      onclose={(r: boolean) => {
        previewing = false
        if (r) reload()
      }}
    />
  {/if}
  {#if loading}
    <div class="loading">
      <Loader />
    </div>
  {:else if info}
    <div class="shareInfo">
      <h2>{shareInfo.collection.name}</h2>
      <div class="details">
        <span>Collection</span>
        <span>{info?.files.length} items</span>
        <span>{shareInfo.views} view{shareInfo.views === 1 ? '' : 's'}</span>
        <span>{formatDate(shareInfo.createdAt)}</span>
      </div>
    </div>
    <div class="files">
      {#if info.files.length === 0}
        <div class="empty">No files here.</div>
      {:else}
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

<style>
  .collection {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    height: 100%;
    animation: appear 500ms ease;
  }

  .files {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    animation: appear 500ms ease;
    border: 1px solid #222;
    border-radius: 10px;
    overflow-y: auto;
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

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    animation: fade 500ms ease;
  }

  .files .empty {
    display: flex;
    justify-content: center;
    color: #aaa;
    margin-top: 20px;
  }

  .files::-webkit-scrollbar-track {
    background: #111;
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
    background: #111;
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
    color: #aaa;
    font-size: 14px;
  }

  .files .item .info span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
    margin: 0 5px;
  }
</style>
