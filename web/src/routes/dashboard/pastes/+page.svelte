<script lang="ts">
  import { onMount } from 'svelte'
  import { formatDate, req } from '$lib/utils'
  import { prompt, alert } from '$lib/popups'
  import PasteView from '../../../components/PasteView.svelte'
  import Loader from '../../../components/Loader.svelte'
  import { createMessage } from '$lib/messages.js'

  interface Paste {
    id: string
    name: string
    type: string
    createdAt: string
    updatedAt: string
  }

  let pastes: Paste[] | null = $state(null)
  let previewing: string | false = $state(false)

  async function load() {
    pastes = null
    const res = await req.get('paste')
    if (!res) return

    pastes = res.data
  }

  async function add() {
    const name = await prompt({
      title: 'Create Paste',
      content: 'Please enter a name for the new paste',
      placeholder: 'Enter a name...',
      buttons: [
        {
          text: 'Continue'
        },
        {
          text: 'Cancel'
        }
      ]
    })
    if (!name.type || !name.input) return

    const content = await prompt({
      title: 'Create Paste',
      content: 'Please enter the content for the new paste',
      placeholder: 'Enter content...',
      buttons: [
        {
          text: 'Create'
        },
        {
          text: 'Cancel'
        }
      ]
    })
    if (!content.type || !content.input) return

    const res = await req.post('paste', {
      name: name.input,
      content: content.input,
      type: 'text'
    })
    if (!res) return

    if (res.status !== 200)
      return await alert({
        title: 'Error',
        content: res.data.message
      })

    createMessage({
      title: 'Paste Created',
      type: 'success',
      content: 'The paste has been created.'
    })

    load()
  }

  async function delPaste(id: string) {
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
      return await alert({
        title: 'Error',
        content: res.data.message
      })

    createMessage({
      title: 'Paste Deleted',
      type: 'success',
      content: 'The paste has been deleted.'
    })

    load()
  }

  async function editPaste(id: string) {
    if (!pastes) return
    const paste = pastes.find(p => p.id === id)
    if (!paste)
      return await alert({
        title: 'Error',
        content: 'Paste not found'
      })

    const name = await prompt({
      title: 'Edit Paste',
      content: 'Please enter a new name for the paste',
      placeholder: 'Enter a name...',
      defaultValue: paste.name,
      buttons: [
        {
          text: 'Continue'
        },
        {
          text: 'Cancel'
        }
      ]
    })
    if (!name.type || !name.input) return

    const res = await req.patch(`paste/${id}`, {
      name: name.input
    })
    if (!res) return

    if (res.status !== 204)
      return await alert({
        title: 'Error',
        content: res.data.message
      })

    createMessage({
      title: 'Paste Updated',
      type: 'success',
      content: 'The paste has been updated.'
    })

    load()
  }

  onMount(load)
</script>

<main>
  <div class="v-align">
    <h2>Pastes</h2>
    <button onclick={add}>
      <span class="material-icons">add</span>
    </button>
  </div>
  {#if previewing}
    <PasteView
      onclose={c => {
        if (c === true) load()
        previewing = false
      }}
      id={previewing}
    />
  {/if}
  {#if pastes}
    <div class="pasteList">
      {#if pastes.length === 0}
        <p>No pastes found. Press + to create one!</p>
      {:else}
        {#each pastes as paste}
          <button
            class="paste"
            tabindex="0"
            onclick={() => (previewing = paste.id)}
          >
            <p>{paste.name}</p>
            <div class="right">
              <div class="info">
                <p>{formatDate(paste.updatedAt)}</p>
                <p>{paste.type}</p>
              </div>
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div class="actions">
                <span
                  class="action"
                  data-color="orange"
                  tabindex="0"
                  role="button"
                  onclick={e => {
                    e.stopPropagation()
                    editPaste(paste.id)
                  }}
                >
                  <span class="material-icons">edit</span>
                </span>
                <span
                  class="action"
                  data-color="red"
                  tabindex="0"
                  role="button"
                  onclick={e => {
                    e.stopPropagation()
                    delPaste(paste.id)
                  }}
                >
                  <span class="material-icons">delete</span>
                </span>
              </div>
            </div>
          </button>
        {/each}
      {/if}
    </div>
  {:else}
    <div class="loader">
      <Loader />
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: appear 500ms ease;
  }

  .loader {
    margin: auto;
  }

  .v-align button {
    color: #0064ff;
  }

  .pasteList {
    display: flex;
    flex-direction: column;
    background: #111;
    padding: 10px;
    border-radius: 10px;
    animation: appear 500ms ease;
  }

  .paste {
    all: unset;
    padding: 10px;
    border-radius: 5px;
    transition: 200ms ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .paste:hover {
    background: #222;
  }

  .paste > p {
    font-size: 18px;
    font-weight: bold;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .paste .right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 15px;
    margin-left: 20px;
  }

  .paste .info {
    display: flex;
    align-items: center;
    width: max-content;
  }

  .paste .info p {
    display: flex;
    align-items: center;
    color: #aaa;
    font-size: 14px;
  }

  .paste .info p:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
    margin: 0 5px;
  }

  .paste .actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .paste .actions .action {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: 200ms ease;
    opacity: 0.8;
  }

  .paste .actions .action:hover {
    opacity: 1;
  }

  .paste .actions .action[data-color='red'] {
    color: red;
  }

  .paste .actions .action[data-color='orange'] {
    color: orange;
  }

  .paste .actions .action span {
    font-size: 20px;
  }
</style>
