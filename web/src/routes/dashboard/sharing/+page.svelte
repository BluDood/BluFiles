<script lang="ts">
  import { onMount } from 'svelte'

  import { formatBytes } from '$lib/utils'
  import { req } from '$lib/utils'

  import CollectionView from '$components/CollectionView.svelte'
  import FolderView from '$components/FolderView.svelte'
  import PasteView from '$components/PasteView.svelte'
  import FileView from '$components/FileView.svelte'
  import Loader from '$components/Loader.svelte'

  interface Dialog {
    open: boolean
    type: 'file' | 'folder' | 'collection' | 'paste' | null
    id: string | null
  }

  let dialog: Dialog = $state({
    open: false,
    type: null,
    id: null
  })

  interface Share {
    type: 'file' | 'folder' | 'collection' | 'paste'
    views: number
    file?: {
      id: string
      name: string
      size: number
    }
    folder?: {
      id: string
      name: string
      fileCount: number
      folderCount: number
    }
    collection?: {
      id: string
      name: string
      fileCount: number
    }
    paste?: {
      id: string
      name: string
    }
  }

  let shares: Share[] | null = $state(null)

  function showFile(id: string) {
    dialog = {
      open: true,
      type: 'file',
      id
    }
  }

  function showFolder(id: string) {
    dialog = {
      open: true,
      type: 'folder',
      id
    }
  }

  function showCollection(id: string) {
    dialog = {
      open: true,
      type: 'collection',
      id
    }
  }

  function showPaste(id: string) {
    dialog = {
      open: true,
      type: 'paste',
      id
    }
  }

  function onclose() {
    dialog = {
      open: false,
      type: null,
      id: null
    }

    load()
  }

  async function load() {
    const res = await req.get('share')
    if (!res) return

    shares = res.data
  }

  onMount(load)
</script>

<main>
  {#if dialog.open}
    {#if dialog.type === 'collection'}
      <CollectionView id={dialog.id!} {onclose} />
    {:else if dialog.type === 'folder'}
      <FolderView id={dialog.id!} {onclose} />
    {:else if dialog.type === 'file'}
      <FileView id={dialog.id!} {onclose} />
    {:else if dialog.type === 'paste'}
      <PasteView id={dialog.id!} {onclose} />
    {/if}
  {/if}
  <h2>Sharing</h2>
  {#if shares}
    {#if shares.length > 0}
      {#if shares.filter(s => s.type === 'collection').length > 0}
        <div class="section">
          <h2>Collections</h2>
          <div class="list">
            {#each shares.filter(s => s.type === 'collection') as collection}
              <button
                class="item"
                onclick={() => showCollection(collection.collection!.id)}
              >
                <span class="material-icons icon"> collections </span>
                <div class="info">
                  <div class="name">
                    {collection.collection!.name}
                  </div>
                  <span class="metadata">
                    {collection.collection!.fileCount} items • {collection.views}
                    views
                  </span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
      {#if shares.filter(s => s.type === 'folder').length > 0}
        <div class="section">
          <h2>Shared Folders</h2>
          <div class="list">
            {#each shares.filter(s => s.type === 'folder') as folder}
              <button
                class="item"
                onclick={() => showFolder(folder.folder!.id)}
              >
                <span class="material-icons icon"> folder </span>
                <div class="info">
                  <div class="name">
                    {folder.folder!.name}
                  </div>
                  <div class="metadata">
                    {folder.folder!.fileCount + folder.folder!.folderCount} items
                    •
                    {folder.views} views
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
      {#if shares.filter(s => s.type === 'file').length > 0}
        <div class="section">
          <h2>Shared Files</h2>
          <div class="list">
            {#each shares.filter(s => s.type === 'file') as share}
              <button class="item" onclick={() => showFile(share.file!.id)}>
                <span class="material-icons icon"> insert_drive_file </span>
                <div class="info">
                  <div class="name">
                    {share.file!.name}
                  </div>
                  <div class="metadata">
                    {formatBytes(share.file!.size)} • {share.views} views
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
      {#if shares.filter(s => s.type === 'paste').length > 0}
        <div class="section">
          <h2>Shared Pastes</h2>
          <div class="list">
            {#each shares.filter(s => s.type === 'paste') as share}
              <button class="item" onclick={() => showPaste(share.paste!.id)}>
                <span class="material-icons icon"> description </span>
                <div class="info">
                  <div class="name">
                    {share.paste!.name}
                  </div>
                  <div class="metadata">
                    {share.views} views
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      <p>No shares found.</p>
    {/if}
  {:else}
    <div class="loader">
      <Loader />
    </div>
  {/if}
</main>

<style>
  main {
    animation: appear 500ms ease;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .section {
    background: #111;
    border-radius: 10px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .list {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }

  .item {
    all: unset;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 200ms ease;
    max-width: 400px;
    width: calc(100% - 20px);
  }

  .item:hover {
    background: #222;
  }

  .item .icon {
    color: #fff;
    font-size: 30px;
  }

  .item .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: calc(100% - 45px);
  }

  .item .info .name {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .item .info .metadata {
    font-size: 14px;
    color: #aaa;
  }
</style>
