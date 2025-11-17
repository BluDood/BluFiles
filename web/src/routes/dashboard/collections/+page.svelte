<script lang="ts">
  import { onMount } from 'svelte'

  import { createMessage } from '$lib/messages.js'
  import { formatDate, req } from '$lib/utils'
  import { prompt, alert } from '$lib/popups'

  import CollectionView from '$components/CollectionView.svelte'
  import Loader from '$components/Loader.svelte'

  let previewing: string | false = $state(false)

  interface Collection {
    id: string
    name: string
    count: number
    createdAt: string
  }

  let collections: Collection[] | null = $state(null)

  async function load() {
    const res = await req.get('collection')
    if (!res) return

    collections = res.data
  }

  async function add() {
    const name = await prompt({
      title: 'Create Collection',
      content: 'Please enter a name for the new collection',
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

    const res = await req.post('collection', {
      name: name.input
    })
    if (!res) return

    createMessage({
      title: 'Collection Created',
      type: 'success',
      content: 'The collection has been created.'
    })

    load()
  }

  async function edit(id: string) {
    if (!collections) return
    const collection = collections.find(p => p.id === id)
    if (!collection)
      return await alert({
        title: 'Error',
        content: 'Collection not found'
      })

    const name = await prompt({
      title: 'Edit Collection',
      content: 'Please enter a new name for the collection',
      placeholder: 'Enter a name...',
      defaultValue: collection.name,
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

    const res = await req.patch(`collection/${id}`, {
      name: name.input
    })
    if (!res) return

    if (res.status !== 204)
      return await alert({
        title: 'Error',
        content: res.data.message
      })

    createMessage({
      title: 'Collection Updated',
      type: 'success',
      content: 'The collection has been updated.'
    })

    load()
  }

  async function del(id: string) {
    const confirmed = await alert({
      title: 'Delete Collection',
      content:
        'Are you sure you want to delete this collection? This will not delete its files.',
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

    const res = await req.delete(`collection/${id}`)
    if (!res) return

    if (res.status !== 204)
      return await alert({
        title: 'Error',
        content: res.data.message
      })

    createMessage({
      title: 'Collection Deleted',
      type: 'success',
      content: 'The collection has been deleted.'
    })

    load()
  }

  onMount(load)
</script>

<main>
  <div class="v-align">
    <h2>Collections</h2>
    <button onclick={add}>
      <span class="material-icons">add</span>
    </button>
  </div>
  {#if previewing}
    <CollectionView
      onclose={(c: boolean) => {
        if (c === true) load()
        previewing = false
      }}
      id={previewing}
    />
  {/if}
  {#if collections}
    <div class="collectionList">
      {#if collections.length === 0}
        <p>No collections found. Press + to create one!</p>
      {:else}
        {#each collections as collection}
          <button
            class="collection"
            onclick={() => (previewing = collection.id)}
          >
            <p>{collection.name}</p>
            <div class="right">
              <div class="info">
                <p>{collection.count} items</p>
                <p>{formatDate(collection.createdAt)}</p>
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
                    edit(collection.id)
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
                    del(collection.id)
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

  .collectionList {
    display: flex;
    flex-direction: column;
    background: #111;
    padding: 10px;
    border-radius: 10px;
    animation: appear 500ms ease;
  }

  .collection {
    all: unset;
    padding: 10px;
    border-radius: 5px;
    transition: 200ms ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .collection:hover {
    background: #222;
  }

  .collection > p {
    font-size: 18px;
    font-weight: bold;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .collection .right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 15px;
    margin-left: 20px;
  }

  .collection .info {
    display: flex;
    align-items: center;
    margin-left: 20px;
    width: max-content;
  }

  .collection .info > p {
    font-size: 14px;
    color: #aaa;
  }

  .collection .info > p:not(:first-child)::before {
    content: '•';
    margin: 0 5px;
  }

  .collection .actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .collection .actions .action {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: 200ms ease;
    opacity: 0.8;
  }

  .collection .actions .action:hover {
    opacity: 1;
  }

  .collection .actions .action[data-color='red'] {
    color: red;
  }

  .collection .actions .action[data-color='orange'] {
    color: orange;
  }

  .collection .actions .action span {
    font-size: 20px;
  }
</style>
