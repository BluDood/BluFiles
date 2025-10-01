<script>
  import { onMount } from 'svelte'
  import Loader from '$components/Loader.svelte'
  import { formatDate, req } from '$lib/utils'
  import { prompt, alert } from '$lib/popups'
  import PasteView from '../../../components/PasteView.svelte'

  let pastes
  let previewing = false

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
          text: 'Continue',
          type: true
        },
        {
          text: 'Cancel',
          type: false
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
          text: 'Create',
          type: true
        },
        {
          text: 'Cancel',
          type: false
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

    if (res.status !== 200) return alert('An error has occurred')

    load()
  }

  async function delPaste(id) {
    const confirmed = await alert({
      title: 'Delete Paste',
      content: 'Are you sure you want to delete this paste?',
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

    const res = await req.delete(`paste/${id}`)
    if (!res) return

    if (res.status !== 204) return alert('An error has occurred')

    load()
  }

  async function editPaste(id) {
    const paste = pastes.find(p => p.id === id)
    if (!paste) return alert('Paste not found')

    const name = await prompt({
      title: 'Edit Paste',
      content: 'Please enter a new name for the paste',
      placeholder: 'Enter a name...',
      value: paste.name,
      buttons: [
        {
          text: 'Continue',
          type: true
        },
        {
          text: 'Cancel',
          type: false
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
        text: res.data.message
      })

    load()
  }

  onMount(load)
</script>

<main>
  <div class="v-align">
    <h2>Pastes</h2>
    <button on:click={add}>
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
          <button class="paste" on:click={() => (previewing = paste.id)}>
            <p>{paste.name}</p>
            <div class="right">
              <div class="info">
                <p>{formatDate(paste.updatedAt)}</p>
                <p>{paste.type}</p>
              </div>
              <div class="actions">
                <button
                  data-color="orange"
                  on:click={e => {
                    e.stopPropagation()
                    editPaste(paste.id)
                  }}
                >
                  <span class="material-icons">edit</span>
                </button>
                <button
                  data-color="red"
                  on:click={e => {
                    e.stopPropagation()
                    delPaste(paste.id)
                  }}
                >
                  <span class="material-icons">delete</span>
                </button>
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
    gap: 10px;
    width: max-content;
  }

  .paste .actions button {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: 200ms ease;
    opacity: 0.8;
  }

  .paste .actions button:hover {
    opacity: 1;
  }

  .paste .actions button[data-color='red'] {
    color: red;
  }

  .paste .actions button[data-color='orange'] {
    color: orange;
  }

  .paste .actions button span {
    font-size: 20px;
  }
</style>
