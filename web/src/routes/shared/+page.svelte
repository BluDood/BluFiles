<script lang="ts">
  import { onMount } from 'svelte'

  import { goto } from '$app/navigation'
  import { page } from '$app/state'

  import { req } from '$lib/utils.js'

  import SharedCollectionView from './SharedCollectionView.svelte'
  import SharedFolderView from './SharedFolderView.svelte'
  import SharedPasteView from './SharedPasteView.svelte'
  import SharedFileView from './SharedFileView.svelte'
  import Loader from '$components/Loader.svelte'

  interface BaseShareInfo {
    id: string
    ownerId: string
    type: 'file' | 'folder' | 'collection' | 'paste'
    views: number
    createdAt: string
    owner: {
      id: string
      username: string
    }
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

  interface CollectionShareInfo extends BaseShareInfo {
    type: 'collection'
    collection: {
      id: string
      name: string
      itemCount: number
    }
  }

  type ShareInfo =
    | FileShareInfo
    | FolderShareInfo
    | PasteShareInfo
    | CollectionShareInfo

  let info: ShareInfo | null = $state(null)
  let requiresPassword = $state(false)
  let password = $state('')

  async function load() {
    requiresPassword = false
    const id = page.url.searchParams.get('id')
    if (!id) return goto('/')

    const res = await req.get(`/share/${id}`, {
      no401Redirect: true,
      headers: {
        'x-share-password': password
      }
    })
    if (res.status === 404) return goto('/')
    if (res.status === 401) {
      requiresPassword = true
      return
    }

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
      <div class="owner">
        {info.owner.username} has shared a {info.type} with you
      </div>
    {/if}
  </div>
  <div class="content">
    {#if info}
      {#if info.type === 'file'}
        <SharedFileView {info} {password} />
      {:else if info.type === 'folder'}
        <SharedFolderView {info} {password} />
      {:else if info.type === 'paste'}
        <SharedPasteView {info} />
      {:else if info.type === 'collection'}
        <SharedCollectionView {info} {password} />
      {/if}
    {:else if requiresPassword}
      <div class="password">
        <p>
          This share is protected by a password. Please enter it below to access
          the content.
        </p>
        <input
          type="password"
          placeholder="Password"
          bind:value={password}
          onkeydown={e => {
            if (e.key === 'Enter') load()
          }}
        />
        <div class="buttons">
          <button data-color="blue" onclick={load}>Submit</button>
        </div>
      </div>
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
    color: var(--text-sec);
  }

  .header .owner {
    font-size: 18px;
    color: var(--text-sec);
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

  .password {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    animation: appear 500ms ease;
  }

  .password input {
    all: unset;
    box-sizing: border-box;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--background-ter);
    color: var(--text);
    width: 80%;
    max-width: 400px;
    outline: 1px solid transparent;
    outline-offset: 2px;
    transition: 200ms ease;
  }

  .password input:hover {
    background-color: var(--hover);
  }

  .password input:focus {
    outline-color: var(--accent);
    background-color: var(--hover);
  }

  .password input:not(select):read-only:focus {
    outline-color: var(--outline);
  }

  .password .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .password .buttons button {
    all: unset;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--button-color, var(--foreground));
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
  }

  .password .buttons button:hover {
    opacity: 0.8;
  }

  .password .buttons button:focus {
    outline-color: var(--button-color, var(--outline));
  }

  .password .buttons button[data-color='blue'] {
    --button-color: var(--accent);
  }
</style>
