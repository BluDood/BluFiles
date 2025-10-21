<script lang="ts">
  import { formatBytes, formatDate, req } from '$lib/utils.js'
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import Loader from '../../components/Loader.svelte'
  import SharedFileView from './SharedFileView.svelte'
  import SharedFolderView from './SharedFolderView.svelte'
  import SharedPasteView from './SharedPasteView.svelte'
  import { goto } from '$app/navigation'

  interface BaseShareInfo {
    id: string
    ownerId: string
    type: 'file' | 'folder' | 'collection' | 'paste'
    views: number
  }

  interface FileShareInfo extends BaseShareInfo {
    type: 'file'
    file: {
      id: string
      name: string
      size: number
      mime: string
    }
  }

  interface FolderShareInfo extends BaseShareInfo {
    type: 'folder'
    folder: {
      id: string
      name: string
      itemCount: number
    }
  }

  interface PasteShareInfo extends BaseShareInfo {
    type: 'paste'
    paste: {
      id: string
      name: string
      content: string
      type: string
    }
  }

  type ShareInfo = FileShareInfo | FolderShareInfo | PasteShareInfo

  let info: ShareInfo | null = $state(null)

  async function load() {
    const id = page.url.searchParams.get('id')
    if (!id) return goto('/')
    const res = await req.get(`/share/${id}`)
    info = res.data as ShareInfo
  }

  onMount(load)
</script>

<main>
  <div class="header">
    <div class="title">
      <img src="/assets/BluFilesSquare.png" alt="" />
      <div class="text">BluFiles <span class="thin"> Sharing </span></div>
    </div>
    {#if info}
      <div class="owner">BluDood has shared a {info.type} with you</div>
    {/if}
  </div>
  <div class="content">
    {#if info}
      {#if info.type === 'file'}
        <SharedFileView {info} />
      {:else if info.type === 'folder'}
        <SharedFolderView {info} />
      {:else if info.type === 'paste'}
        <SharedPasteView {info} />
      {/if}
    {:else}
      <div class="load">
        <Loader />
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100svh;
  }

  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 50px;
  }

  .header .title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header .title img {
    height: 50px;
    width: 50px;
  }

  .header .title .text {
    font-size: 32px;
    font-weight: bold;
  }

  .header .title .text .thin {
    font-weight: normal;
    color: #aaa;
  }

  .header .owner {
    font-size: 18px;
    color: #ccc;
    animation: appear 500ms ease;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 30px;
    gap: 20px;
    flex: 1;
    width: 100%;
    max-width: 1200px;
    padding: 50px;
    padding-top: 0;
  }

  .load {
    animation: appear 500ms ease;
  }
</style>
