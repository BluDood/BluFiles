<script>
  import Loader from '$components/Loader.svelte'
  import { onMount } from 'svelte'

  import { formatDate, req } from '$lib/utils'
  import { prompt, alert } from '$lib/popups'
  import CollectionView from '../../../components/CollectionView.svelte'

  let previewing = false

  let collections

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

    const res = await req.post('collection', {
      name: name.input
    })
    if (!res) return

    load()
  }

  onMount(load)
</script>

<main>
  <div class="v-align">
    <h2>Collections</h2>
    <button on:click={add}>
      <span class="material-icons">add</span>
    </button>
  </div>
  {#if previewing}
    <CollectionView
      onclose={c => {
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
            on:click={() => (previewing = collection.id)}
          >
            <p>{collection.name}</p>
            <div class="info">
              <p>{collection.count} items</p>
              <p>{formatDate(collection.createdAt)}</p>
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

  .collection .info {
    display: flex;
    margin-left: 20px;
  }

  .collection .info > p {
    font-size: 14px;
    color: #aaa;
  }

  .collection .info > p:not(:first-child)::before {
    content: '•';
    margin: 0 5px;
  }
</style>
