<script>
  import Loader from '$components/Loader.svelte'
  import { onMount } from 'svelte'
  import { formatDate, formatBytes, req } from '$lib/utils'
  import { prompt, alert, select } from '$lib/popups'
  import { createMessage } from '$lib/messages'
  import FileView from './FileView.svelte'

  export let id
  export let onclose

  let previewing = false

  let closing = false
  let loading = true
  let info

  let files

  function close(reload = false) {
    closing = true
    setTimeout(() => onclose(reload), 200)
  }

  async function removeFile() {}

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
          'Are you sure you want to create a shareable link for this collection?',
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
        type: 'collection',
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

  async function delCollection() {
    const confirmed = await alert({
      title: 'Delete Collection',
      content: `Are you sure you want to delete the collection "${info.name}"?`,
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

    const res = await req.delete(`collection/${id}`)

    if (!res) return

    await createMessage({
      title: 'Collection deleted!',
      type: 'success'
    })

    close(true)
  }

  async function load() {
    const res = await req.get(`collection/${id}`)

    if (!res) return close()

    info = res.data

    files = info.files.map(file => ({
      ...file,
      size: formatBytes(file.size),
      updatedAt: formatDate(file.updatedAt)
    }))

    loading = false
  }

  onMount(load)
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
  {#if previewing}
    <FileView
      onclose={c => {
        previewing = false
        load()
      }}
      id={previewing}
    />
  {/if}
  {#if loading}
    <Loader />
  {:else}
    <div class="collection">
      <div class="v-align">
        <h1>{info.name}</h1>
        <button on:click={() => close()}>
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="details">
        <span>Collection</span>
        <span>{formatDate(info.createdAt)}</span>
      </div>
      {#if files.length === 0}
        <p class="none">No files found.</p>
      {:else}
        <div class="items">
          {#each files as file}
            <button on:click={() => (previewing = file.id)} class="item">
              <p class="title">
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
                {file.name}
              </p>
              <div class="info">
                <p>{file.size}</p>
                <p>{file.updatedAt}</p>
                <div class="itemActions">
                  <button
                    on:click|stopPropagation={() => removeFile(file.id)}
                    data-color="red"
                  >
                    <span class="material-icons">close</span>
                  </button>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
      <div class="actions">
        <button on:click={share} data-color={info.shareId ? 'blue' : 'gray'}>
          <span class="material-icons">share</span>
        </button>
        <button on:click={delCollection} data-color="red">
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

  .collection {
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

  .collection h1 {
    font-size: 28px;
  }

  .wrapper[data-closing='true'] .collection {
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
    color: #aaa;
    font-size: 14px;
  }

  .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
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
    color: red;
  }

  .actions button[data-color='green'] {
    color: #00c800;
  }

  .actions button[data-color='gray'] {
    color: gray;
  }

  .actions button[data-color='blue'] {
    color: #0064ff;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    justify-content: space-between;
    min-width: 400px;
    gap: 30px;
  }

  .item:hover {
    background: #222;
  }

  .item > p {
    font-size: 18px;
    font-weight: bold;
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
    color: #aaa;
  }

  .item .info > p:not(:first-child)::before {
    content: '•';
    margin: 0 5px;
  }

  .item .itemActions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 10px;
  }

  .item .itemActions button {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .item .itemActions button[data-color='red'] {
    color: red;
  }

  .none {
    color: #aaa;
    font-size: 14px;
    text-align: center;
    margin: 10px;
  }
</style>
