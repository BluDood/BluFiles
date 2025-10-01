<script>
  import { onMount } from 'svelte'
  import Loader from '$components/Loader.svelte'
  import { formatDate, req, formatUA } from '$lib/utils'
  import { prompt, alert } from '$lib/popups'

  let tokens

  async function load() {
    tokens = null
    const res = await req.get('me/tokens')
    if (!res) return

    tokens = res.data
      .sort((a, b) => b.usedAt - a.usedAt)
      .sort(a => (a.me ? -1 : 1))
  }

  async function add() {
    const name = await prompt({
      title: 'Create Token',
      content: 'Please enter a name for the token',
      placeholder: 'Enter a name...',
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

    if (!name.type) return

    const res = await req.post('me/tokens', {
      name: name.input
    })

    if (!res) return

    if (res.status !== 200)
      return await alert({
        title: 'An error has occurred',
        content: res.data.message
      })

    await prompt({
      title: 'Token Created',
      content: 'Please copy it now, as it cannot be shown again.',
      readonly: true,
      defaultValue: res.data.token,
      buttons: [
        {
          text: 'Done'
        }
      ]
    })

    load()
  }

  async function del(id, self) {
    const confirmed = await alert({
      title: 'Delete Token',
      content: `Are you sure you want to delete this token? ${
        self ? 'You will be logged out.' : ''
      }`,
      buttons: [
        {
          text: self ? 'Delete and Log Out' : 'Delete',
          color: 'red',
          type: 'done'
        },
        {
          text: 'Cancel',
          type: 'cancel'
        }
      ]
    })

    if (confirmed !== 'done') return

    const res = await req.delete(`me/tokens`, {
      data: {
        id
      }
    })
    if (!res) return

    if (res.status !== 204)
      return await alert({
        title: 'An error has occurred',
        content: res.data.message
      })

    load()
  }

  onMount(load)
</script>

<main>
  <div class="v-align">
    <h2>Tokens</h2>
    <button on:click={add}>
      <span class="material-icons">add</span>
    </button>
  </div>
  {#if tokens}
    <div class="tokenList">
      {#if tokens.length === 0}
        <p>No tokens found. Press + to create one!</p>
      {:else}
        {#each tokens as token}
          <div class="token">
            <div class="name">
              <span class="material-icons">
                {token.type === 'user' ? 'person' : 'code'}
              </span>
              <p>
                {#if token.type === 'user'}
                  {formatUA(token.userAgent)}
                  {#if token.me}
                    <p class="current">(current session)</p>
                  {/if}
                {:else}
                  {token.name}
                {/if}
              </p>
            </div>
            <div class="info">
              <p>
                {token.usedAt
                  ? `Last used ${formatDate(token.usedAt)}`
                  : 'Never used'}
              </p>
              <div class="actions">
                <button on:click={() => del(token.id, token.me)}>
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
          </div>
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

  .v-align button {
    color: #0064ff;
  }

  .loader {
    margin: auto;
  }

  .tokenList {
    display: flex;
    flex-direction: column;
    background: #111;
    padding: 10px;
    border-radius: 10px;
    animation: appear 500ms ease;
  }

  .token {
    all: unset;
    padding: 10px;
    border-radius: 5px;
    transition: 200ms ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .token .name {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .token .name p {
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .token .name .current {
    display: inline-block;
    font-size: 14px;
    color: rgb(0, 255, 50);
  }

  .token .info {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .token .info > p {
    font-size: 14px;
    color: #aaa;
  }

  .token .info > p:not(:first-child)::before {
    content: '•';
    margin: 0 5px;
  }

  .token .info .actions {
    display: flex;
    gap: 10px;
  }

  .token .info .actions button {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #0064ff;
  }
</style>
