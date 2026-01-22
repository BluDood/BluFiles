<script lang="ts">
  import { onMount } from 'svelte'

  import { formatBytes, formatDate, req } from '$lib/utils'
  import { createMessage } from '$lib/messages.js'
  import { SHARE_URL } from '$lib/constants.js'
  import { alert } from '$lib/popups'

  import Loader from './Loader.svelte'
  import Monaco from './Monaco.svelte'
  import CircularProgress from './CircularProgress.svelte'

  let {
    id,
    onclose
  }: {
    id: string
    onclose: (reload: boolean) => void
  } = $props()

  let closing = $state(false)
  let loading = $state(true)
  let error: string | null = $state(null)

  let downloading = $state(false)
  let downloadProgress = $state(0)

  interface FileInfo {
    id: string
    name: string
    size: number
    mime: string
    updatedAt: string
    shareId: string | null
  }

  let info: FileInfo | null = $state(null)
  let data: Blob | null = $state(null)
  let type: string | null = $state(null)
  let dataURL: string | null = $state(null)
  let rawData: string = $state('')
  let extension: string = $derived.by(() => {
    if (!info) return ''
    const parts = info.name.split('.')
    if (parts.length < 2) return ''
    return parts.pop()!.toLowerCase()
  })

  const types = [
    {
      type: 'image',
      mime: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      downloadRaw: true,
      downloadBlob: true
    },
    {
      type: 'text',
      mime: ['text/plain', 'text/html', 'text/css', 'text/javascript'],
      downloadRaw: true
    },
    {
      type: 'video',
      mime: ['video/mp4', 'video/webm'],
      downloadRaw: true,
      downloadBlob: true
    },
    {
      type: 'audio',
      mime: ['audio/mpeg', 'audio/ogg', 'audio/wav'],
      downloadRaw: true,
      downloadBlob: true
    }
  ]

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
          'Are you sure you want to create a shareable link for this file?',
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
        type: 'file',
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

  async function download() {
    if (!info) return

    downloading = true
    downloadProgress = 0

    const raw = await req.get(`file/${id}/raw`, {
      responseType: 'blob',
      onDownloadProgress: p => {
        if (!p.total) return
        const progress = Math.round((p.loaded / p.total) * 100)
        downloadProgress = progress
      }
    })
    if (!raw) return

    const url = URL.createObjectURL(raw.data)

    const a = document.createElement('a')
    a.href = url
    a.download = info.name
    a.click()
    URL.revokeObjectURL(url)
    a.remove()

    downloading = false
  }

  async function del() {
    if (!info) return
    const confirmed = await alert({
      title: 'Delete File',
      content: `Are you sure you want to delete the file "${info.name}"?`,
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

    close(true)
  }

  async function convert() {
    if (!data || !info) return null
    return await new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.onload = e => resolve(e.target!.result)

      fileReader.onerror = e => reject(e)

      fileReader.readAsDataURL(new File([data!], '', { type: info!.mime }))
    })
  }

  onMount(async () => {
    const res = await req.get(`file/${id}`)
    if (res.status !== 200) {
      if (res.status === 404) error = 'The file was not found.'
      else error = 'Please try again later.'
      loading = false
      return
    }

    info = res.data
    const foundType = types.find(t => t.mime.includes(info!.mime))
    type = foundType?.type ?? null

    if (foundType?.downloadRaw === true) {
      const raw = await req.get(`file/${id}/raw`, {
        responseType: 'blob'
      })
      if (!res) return
      data = raw.data
      if (foundType.downloadBlob) {
        const url = await convert()
        dataURL = url as string
      } else {
        const reader = new FileReader()
        reader.onload = () => {
          rawData = reader.result as string
        }
        reader.readAsText(data!)
      }
    }
    loading = false
  })
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
    <div class="fileview">
      <div class="v-align">
        <h1>{info.name}</h1>
        <button onclick={() => close()}>
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="details">
        <span>File</span>
        <span>{formatDate(info.updatedAt)}</span>
        <span>{formatBytes(info.size)}</span>
        <span>{info.mime}</span>
      </div>
      {#if type === 'image'}
        <img src={dataURL} alt="" />
      {:else if type === 'text'}
        <div class="monaco">
          <Monaco bind:value={rawData} language={extension} readonly={true} />
        </div>
      {:else if type === 'video'}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video src={dataURL} controls></video>
      {:else if type === 'audio'}
        <audio controls>
          <source src={dataURL} type={info.mime} />
        </audio>
      {:else}
        <div class="unsupported">Unsupported file type</div>
      {/if}
      <div class="actions">
        <button onclick={share} data-color={info.shareId ? 'blue' : 'gray'}>
          <span class="material-icons">share</span>
        </button>
        {#if downloading}
          <CircularProgress progress={downloadProgress} size={30} />
        {:else}
          <button onclick={download} data-color="green">
            <span class="material-icons">download</span>
          </button>
        {/if}
        <button onclick={del} data-color="red">
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

  .fileview {
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

  .fileview .v-align {
    gap: 20px;
  }

  .fileview h1 {
    font-size: 28px;
    word-break: break-all;
  }

  .wrapper[data-closing='true'] .fileview {
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

  .fileview .details {
    display: flex;
    align-items: center;
  }

  .fileview .details span {
    display: flex;
    align-items: center;
    color: var(--text-sec);
    font-size: 14px;
  }

  .fileview .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-sec);
    margin: 0 5px;
  }

  .fileview img {
    flex: 1;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: var(--background-ter);
    border-radius: 5px;
    margin: 10px 0;
    min-height: 100px;
    max-height: 300px;
  }

  .fileview .monaco {
    margin: 10px 0;
    overflow: hidden;
    border-radius: 10px;
    resize: both;
    width: 800px;
    height: 400px;
    min-width: 350px;
    min-height: 100px;
    max-width: 100%;
    max-height: calc(100vh - 180px);
  }

  .fileview video {
    flex: 1;
    width: 100%;
    height: 100%;
    background: var(--background-ter);
    border-radius: 5px;
    margin: 10px 0;
    max-height: 300px;
  }

  .fileview audio {
    flex: 1;
    width: 100%;
    height: 100%;
    background: var(--background-ter);
    border-radius: 5px;
    margin: 10px 0;
    max-height: 300px;
  }

  .fileview .unsupported {
    flex: 1;
    width: 100%;
    height: 100%;
    background: var(--background-ter);
    border-radius: 5px;
    margin: 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 0;
    color: var(--text-sec);
  }

  .fileview .actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .fileview .actions button {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 3px;
  }

  .fileview .actions button[data-color='gray'] {
    color: var(--text-ter);
  }

  .fileview .actions button[data-color='red'] {
    color: var(--red);
  }

  .fileview .actions button[data-color='green'] {
    color: var(--green);
  }

  .fileview .actions button[data-color='blue'] {
    color: var(--accent);
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
