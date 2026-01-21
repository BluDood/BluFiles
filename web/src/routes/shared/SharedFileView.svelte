<script lang="ts">
  import { onMount } from 'svelte'

  import { formatBytes, formatDate, req } from '$lib/utils.js'

  import Loader from '$components/Loader.svelte'
  import Monaco from '$components/Monaco.svelte'

  interface Props {
    info: {
      id: string
      ownerId: string
      type: 'file'
      views: number
      createdAt: string
      file: {
        id: string
        name: string
        size: number
        mime: string
      }
    }
  }

  const { info: shareInfo }: Props = $props()

  let type: string | null = $state(null)
  let data: Blob | null = $state(null)
  let dataURL: string | null = $state(null)
  let rawData: string = $state('')
  let extension: string = $derived.by(() => {
    if (!shareInfo) return ''
    const parts = shareInfo.file.name.split('.')
    if (parts.length < 2) return ''
    return parts.pop()!.toLowerCase()
  })

  let loading = $state(true)

  async function convert() {
    if (!data) return null
    return await new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.onload = e => resolve(e.target!.result)

      fileReader.onerror = e => reject(e)

      fileReader.readAsDataURL(
        new File([data!], '', { type: shareInfo.file.mime })
      )
    })
  }

  async function load() {
    const foundType = types.find(t => t.mime.includes(shareInfo.file.mime))
    type = foundType?.type ?? null

    if (foundType?.downloadRaw === true) {
      const res = await req.get(`file/${shareInfo.file.id}/raw`, {
        responseType: 'blob',
        params: {
          shareId: shareInfo.id
        }
      })
      if (!res) return
      data = res.data
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
  }

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

  async function download() {
    if (!data) {
      const res = await req.get(`file/${shareInfo.file.id}/raw`, {
        responseType: 'blob',
        params: {
          shareId: shareInfo.id
        }
      })
      if (!res) return
      data = res.data
    }

    const url = URL.createObjectURL(data!)

    const a = document.createElement('a')
    a.href = url
    a.download = shareInfo.file.name
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  }

  onMount(load)
</script>

<div class="file">
  <div class="info">
    <h2>{shareInfo.file.name}</h2>
    <div class="details">
      <span>File</span>
      <span>{formatBytes(shareInfo.file.size)}</span>
      <span>{shareInfo.file.mime}</span>
      <span>{shareInfo.views} view{shareInfo.views === 1 ? '' : 's'}</span>
      <span>{formatDate(shareInfo.createdAt)}</span>
    </div>
    <div class="buttons">
      <button data-color="blue" onclick={download}> Download File </button>
    </div>
  </div>
  {#if !loading}
    <div class="preview">
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
          <source src={dataURL} type={shareInfo.file.mime} />
        </audio>
      {/if}
    </div>
  {:else}
    <Loader />
  {/if}
</div>

<style>
  .file {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    animation: appear 500ms ease;
  }

  .preview {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .preview:empty {
    display: none;
  }

  .preview video {
    border-radius: 8px;
    min-width: 300px;
    min-height: 300px;
    max-width: 80vw;
    max-height: 50vh;
  }

  .preview img {
    border-radius: 8px;
    min-width: 300px;
    min-height: 300px;
    max-width: 80vw;
    max-height: 50vh;
  }

  .preview .monaco {
    resize: vertical;
    overflow: hidden;
    border-radius: 10px;
    width: 100%;
    height: 300px;
    min-width: 150px;
    min-height: 50px;
    max-width: 100%;
    max-height: 100%;
  }

  .info {
    background: var(--background-sec);
    border-radius: 10px;
    padding: 20px;
    width: 100%;
  }

  .info h2 {
    font-weight: 600;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
    flex: 1;
  }

  .info .details {
    display: flex;
    align-items: center;
  }

  .info .details span {
    display: flex;
    align-items: center;
    color: var(--text-sec);
    font-size: 16px;
  }

  .info .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-sec);
    margin: 0 5px;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    margin-top: 10px;
    gap: 10px;
  }

  .buttons button {
    all: unset;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--button-color, var(--foreground));
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
  }

  .buttons button:hover {
    opacity: 0.8;
  }

  .buttons button:focus {
    outline-color: var(--button-color, var(--outline));
  }

  .buttons button[data-color='blue'] {
    --button-color: var(--accent);
  }
</style>
