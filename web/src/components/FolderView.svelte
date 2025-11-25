<script lang="ts">
  import { onMount } from 'svelte'

  import { formatDate, formatBytes, req } from '$lib/utils'
  import { alert } from '$lib/popups'
  import { createMessage } from '$lib/messages'
  import { SHARE_URL } from '$lib/constants.js'

  import FolderView from './FolderView.svelte'
  import FileView from './FileView.svelte'
  import Loader from './Loader.svelte'

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

  function close(reload = false) {
    closing = true
    setTimeout(() => onclose(reload), 200)
  }

  async function share() {
    if (!info) return
    if (info.shareId) {
      const res = await alert({
        title: `Sharing ${info.name}`,
        content: 'What would you like to do?',
        buttons: [
          {
            text: 'Copy Link',
            type: 'submit'
          },
          {
            text: 'Delete Link',
            type: 'delete',
            color: 'red'
          },
          {
            text: 'Cancel',
            type: 'cancel'
          }
        ]
      })

      if (res.type === 'submit') {
        await navigator.clipboard.writeText(`${SHARE_URL}/${info.shareId}`)
        await createMessage({
          title: 'Link copied!',
          type: 'success',
          content: 'Shareable link copied to your clipboard'
        })
      } else if (res.type === 'delete') {
        const confirmed = await alert({
          title: 'Delete Link',
          content: `Are you sure you want to delete the link for "${info.name}"?`,
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

        const delRes = await req.delete(`share/${info.shareId}`)
        if (!delRes) return

        if (delRes.status !== 204)
          return createMessage({
            type: 'error',
            title: 'An error has occurred',
            content: 'Please try again later.'
          })

        info.shareId = null
        createMessage({
          title: 'Link deleted!',
          type: 'success',
          content: 'The link has been deleted'
        })
      }
    } else {
      const res = await alert({
        title: `Share ${info.name}`,
        content:
          'Are you sure you want to create a shareable link for this folder?',
        buttons: [
          {
            text: 'Create Link'
          },
          {
            text: 'Cancel'
          }
        ]
      })

      if (!res.type) return
      const shareRes = await req.post('share', {
        type: 'folder',
        id: info.id
      })

      if (!shareRes) return
      if (shareRes.status !== 200) {
        const messages: Record<number, string> = {
          403: 'You have reached your share limit.'
        }

        return createMessage({
          type: 'error',
          title: 'An error has occurred',
          content: messages[shareRes.status] || 'Please try again later.'
        })
      }
      info.shareId = shareRes.data.id
      await navigator.clipboard.writeText(`${SHARE_URL}/${info.shareId}`)
      createMessage({
        title: 'Link created and copied!',
        type: 'success',
        content: 'Shareable link copied to your clipboard'
      })
    }
  }

  async function delFolder() {
    if (!info) return
    const confirmed = await alert({
      title: 'Delete Folder',
      content: `Are you sure you want to delete the collection "${info.name}"? This will also delete all contents recursively.`,
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

    const res = await req.delete(`folder/${id}`)

    if (!res) return

    await createMessage({
      title: 'Folder deleted!',
      type: 'success'
    })

    close(true)
  }

  async function load() {
    const res = await req.get(`folder/${id}`)

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
        onclose={() => {
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
        onclose={() => {
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
              <div class="title">
                <span class="material-icons"> folder </span>
                <p class="name">
                  {folder.name}
                </p>
              </div>
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
                <p>{formatBytes(file.size)}</p>
                <p>{formatDate(file.updatedAt)}</p>
              </div>
            </button>
          {/each}
        </div>
      {/if}
      <div class="actions">
        <button onclick={share} data-color={info.shareId ? 'blue' : 'gray'}>
          <span class="material-icons">share</span>
        </button>
        <button onclick={delFolder} data-color="red">
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
    color: var(--text-sec);
  }

  .item .info > p:not(:first-child)::before {
    content: '•';
    margin: 0 5px;
  }

  .none {
    color: var(--text-sec);
    font-size: 14px;
    text-align: center;
    margin: 10px;
  }
</style>
