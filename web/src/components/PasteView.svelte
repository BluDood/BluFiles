<script lang="ts">
  import { onMount } from 'svelte'
  import { formatDate, req } from '$lib/utils'
  import { alert } from '$lib/popups'
  import Loader from './Loader.svelte'
  import { createMessage } from '$lib/messages.js'

  // export let id
  // export let onclose

  let {
    id,
    onclose
  }: {
    id: string
    onclose: (deleted?: boolean) => void
  } = $props()

  let closing = $state(false)
  interface PasteInfo {
    id: string
    name: string
    type: string
    content: string
    createdAt: string
    updatedAt: string
    shareId: string | null
  }
  let info: PasteInfo | null = $state(null)
  let loading = $state(true)
  let editing = $state(false)
  let content: string = $state('')

  function close(c: boolean = false) {
    closing = true
    setTimeout(() => {
      closing = false
      onclose(c)
    }, 200)
  }

  async function load() {
    const res = await req.get(`paste/${id}`)
    if (!res) return

    info = res.data
    content = info!.content
    loading = false
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
        await navigator.clipboard.writeText(
          `${location.origin}/shared?id=${info.shareId}`
        )
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
          return await alert({
            title: 'Error',
            content: delRes.data.message
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
          'Are you sure you want to create a shareable link for this paste?',
        buttons: [
          {
            text: 'Create Link',
            type: 'submit'
          },
          {
            text: 'Cancel',
            type: 'cancel'
          }
        ]
      })

      if (res.type !== 'submit') return
      const shareRes = await req.post(`share`, {
        type: 'paste',
        id: info.id
      })

      if (!shareRes) return
      if (shareRes.status !== 200)
        return await alert({
          title: 'Error',
          content: shareRes.data.message
        })
      info.shareId = shareRes.data.id
      await navigator.clipboard.writeText(
        `${location.origin}/shared?id=${info.shareId}`
      )
      createMessage({
        title: 'Link created and copied!',
        type: 'success',
        content: 'Shareable link copied to your clipboard'
      })
    }
  }

  async function del() {
    const confirmed = await alert({
      title: 'Delete Paste',
      content: 'Are you sure you want to delete this paste?',
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

    const res = await req.delete(`paste/${id}`)
    if (!res) return

    if (res.status !== 204)
      return await alert({ title: 'Error', content: res.data.message })

    close(true)
  }

  async function edit() {
    const res = await req.patch(`paste/${id}`, {
      content
    })
    if (!res) return

    if (res.status !== 204)
      return await alert({ title: 'Error', content: res.data.message })

    editing = false
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
  {#if loading || !info}
    <Loader />
  {:else}
    <div class="pasteview">
      <div class="v-align">
        <h1>{info.name}</h1>
        <button onclick={() => close()}>
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="details">
        <span>{formatDate(info.updatedAt)}</span>
        <span>{info.type}</span>
      </div>
      <textarea readonly={!editing} bind:value={content}></textarea>
      <div class="actions">
        {#if editing}
          <button onclick={edit} data-color="green">
            <span class="material-icons">done</span>
          </button>
          <button
            onclick={() => {
              editing = false
              content = info!.content
            }}
            data-color="red"
          >
            <span class="material-icons">close</span>
          </button>
        {:else}
          <button onclick={share} data-color={info.shareId ? 'blue' : 'gray'}>
            <span class="material-icons">share</span>
          </button>
          <button onclick={() => (editing = true)} data-color="orange">
            <span class="material-icons">edit</span>
          </button>
          <button onclick={del} data-color="red">
            <span class="material-icons">delete</span>
          </button>
        {/if}
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

  .pasteview {
    background: #111;
    padding: 10px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    animation: scale 200ms ease;
    transition: 200ms ease;
    max-height: 90%;
    max-width: 90%;
  }

  .pasteview h1 {
    font-size: 28px;
  }

  .wrapper[data-closing='true'] .pasteview {
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

  .pasteview .details {
    display: flex;
    align-items: center;
  }

  .pasteview .details span {
    display: flex;
    align-items: center;
    color: #aaa;
    font-size: 14px;
  }

  .pasteview .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
    margin: 0 5px;
  }

  .pasteview textarea {
    all: unset;
    background: #222;
    padding: 10px;
    border-radius: 5px;
    margin: 10px 0;
    font-size: 16px;
    font-family: monospace;
    resize: both;
    min-width: 300px;
    min-height: 100px;
  }

  .pasteview .actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pasteview .actions button {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .pasteview .actions button[data-color='gray'] {
    color: gray;
  }

  .pasteview .actions button[data-color='red'] {
    color: red;
  }

  .pasteview .actions button[data-color='green'] {
    color: #00c800;
  }

  .pasteview .actions button[data-color='blue'] {
    color: #0064ff;
  }

  .pasteview .actions button[data-color='orange'] {
    color: orange;
  }
</style>
