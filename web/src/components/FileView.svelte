<script>
  import { onMount } from 'svelte'
  import Loader from '$components/Loader.svelte'
  import { formatBytes, formatDate, req } from '$lib/utils'
  import { alert } from '$lib/popups'

  export let onclose
  export let id

  let closing = false
  let loading = true
  let info
  let data
  let type
  let dataURL

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
    if (info.shareId) {
      const res = await alert({
        title: `Sharing ${info.name}`,
        content: 'What would you like to do?',
        buttons: [
          {
            text: 'Copy Link',
            type: 'submit',
            color: 'blue'
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

      if (res === 'submit') {
        await navigator.clipboard.writeText(`${location.origin}/f/${info.id}`)
        await alert({
          title: 'Link Copied',
          content: 'The link has been copied to your clipboard.'
        })
      } else if (res === 'delete') {
        const confirmed = await alert({
          title: 'Delete Link',
          content: `Are you sure you want to delete the link for "${info.name}"?`,
          buttons: [
            {
              text: 'Delete',
              color: 'red',
              type: true
            },
            {
              text: 'Cancel',
              type: false
            }
          ]
        })

        if (!confirmed) return

        const delRes = await req.delete(`share/${info.shareId}`)
        if (!delRes) return

        if (delRes.status !== 204)
          return await alert({
            title: 'Error',
            text: delRes.data.message
          })

        info.shareId = null
        await alert({
          title: 'Link Deleted',
          content: 'The link has been deleted.'
        })
      }
    } else {
      const res = await alert({
        title: `Share ${info.name}`,
        content:
          'Are you sure you want to create a shareable link for this file?',
        buttons: [
          {
            text: 'Create Link',
            type: 'submit',
            color: 'blue'
          },
          {
            text: 'Cancel',
            type: 'cancel'
          }
        ]
      })

      if (res !== 'submit') return
      const shareRes = await req.post(`share`, {
        type: 'file',
        id: info.id
      })

      if (!shareRes) return
      if (shareRes.status !== 200)
        return await alert({
          title: 'Error',
          text: shareRes.data.message
        })
      info.shareId = shareRes.data.id
      await navigator.clipboard.writeText(`${location.origin}/f/${info.id}`)
      await alert({
        title: 'Link Created',
        content:
          'The shareable link has been created and copied to your clipboard.'
      })
    }
  }

  async function download() {
    const raw = await req.get(`file/${id}/raw`, {
      responseType: 'blob'
    })
    if (!raw) return

    const url = URL.createObjectURL(raw.data)

    const a = document.createElement('a')
    a.href = url
    a.download = info.name
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  }

  async function del() {
    const confirmed = await alert({
      title: 'Delete File',
      content: `Are you sure you want to delete the file "${info.name}"?`,
      buttons: [
        {
          text: 'Delete',
          color: 'red',
          type: true
        },
        {
          text: 'Cancel',
          type: false
        }
      ]
    })

    if (!confirmed) return

    const res = await req.delete(`file/${id}`)
    if (!res) return

    if (res.status !== 204)
      return await alert({
        title: 'Error',
        text: res.data.message
      })

    close(true)
  }

  async function convert() {
    return await new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.onload = e => resolve(e.target.result)

      fileReader.onerror = e => reject(e)

      fileReader.readAsDataURL(new File([data], '', { type: info.mime }))
    })
  }

  onMount(async () => {
    const res = await req.get(`file/${id}`)
    if (!res) return

    info = res.data
    const foundType = types.find(t => t.mime.includes(info.mime))
    type = foundType?.type

    if (foundType?.downloadRaw === true) {
      const raw = await req.get(`file/${id}/raw`, {
        responseType: 'blob'
      })
      if (!res) return
      data = raw.data
      if (foundType.downloadBlob) dataURL = await convert()
    }
    loading = false
  })
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  class="wrapper"
  data-closing={closing}
  on:mousedown={e => {
    if (e.target === e.currentTarget) close()
  }}
  role="dialog"
>
  {#if loading}
    <Loader />
  {:else}
    <div class="fileview">
      <div class="v-align">
        <h1>{info.name}</h1>
        <button on:click={() => close()}>
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
        <pre>{data}</pre>
      {:else if type === 'video'}
        <!-- svelte-ignore a11y-media-has-caption -->
        <video src={dataURL} controls />
      {:else if type === 'audio'}
        <audio controls>
          <source src={dataURL} type={info.mime} />
        </audio>
      {:else}
        <div class="unsupported">Unsupported file type</div>
      {/if}
      <div class="actions">
        <button on:click={share} data-color={info.shareId ? 'blue' : 'gray'}>
          <span class="material-icons">share</span>
        </button>
        <button on:click={download} data-color="green">
          <span class="material-icons">download</span>
        </button>
        <button on:click={del} data-color="red">
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

  .fileview {
    background: #111;
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
    color: #aaa;
    font-size: 14px;
  }

  .fileview .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
    margin: 0 5px;
  }

  .fileview img {
    flex: 1;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #222;
    border-radius: 5px;
    margin: 10px 0;
    min-height: 100px;
    max-height: 300px;
  }

  .fileview pre {
    flex: 1;
    width: 100%;
    height: 100%;
    background: #222;
    border-radius: 5px;
    margin: 10px 0;
    padding: 10px;
    overflow: auto;
    max-height: 300px;
  }

  .fileview video {
    flex: 1;
    width: 100%;
    height: 100%;
    background: #222;
    border-radius: 5px;
    margin: 10px 0;
    max-height: 300px;
  }

  .fileview audio {
    flex: 1;
    width: 100%;
    height: 100%;
    background: #222;
    border-radius: 5px;
    margin: 10px 0;
    max-height: 300px;
  }

  .fileview .unsupported {
    flex: 1;
    width: 100%;
    height: 100%;
    background: #222;
    border-radius: 5px;
    margin: 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 0;
    color: #ccc;
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
  }

  .fileview .actions button[data-color='gray'] {
    color: gray;
  }

  .fileview .actions button[data-color='red'] {
    color: red;
  }

  .fileview .actions button[data-color='green'] {
    color: #00c800;
  }

  .fileview .actions button[data-color='blue'] {
    color: #0064ff;
  }
</style>
