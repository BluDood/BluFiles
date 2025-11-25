<script lang="ts">
  import { onMount } from 'svelte'

  import { userStore } from '$lib/stores'
  import { req } from '$lib/utils'

  import Loader from '$components/Loader.svelte'

  let newUsername = $state('')
  let profileLoading = $state(false)

  async function save() {
    if (!newUsername || !$userStore) return
    if (newUsername === $userStore.username) return
    profileLoading = true
    const res = await req.patch('me', { username: newUsername })

    if (res.status === 204) {
      userStore.update(user => {
        if (user) user.username = newUsername
        return user
      })
    }

    profileLoading = false
  }

  onMount(() => {
    userStore.subscribe(user => {
      if (user) newUsername = user.username
    })
  })
</script>

{#if $userStore}
  <main>
    <div class="v-align">
      <h2>Profile</h2>
      <button
        onclick={save}
        data-hidden={$userStore.username === newUsername}
        disabled={profileLoading}
      >
        {#if profileLoading}
          <span class="material-icons load"> sync </span>
        {:else}
          <span class="material-icons">save</span>
        {/if}
      </button>
    </div>
    <div class="section profile">
      <span class="avatar material-icons"> person </span>
      <div class="info">
        <input class="inline-field" bind:value={newUsername} />
        <p>{$userStore.id}</p>
      </div>
    </div>
  </main>
{:else}
  <div class="loader">
    <Loader />
  </div>
{/if}

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: appear 500ms ease;
  }

  .v-align button {
    color: var(--accent);
    transition: 200ms ease;
  }

  .v-align button[data-hidden='true'] {
    opacity: 0;
    pointer-events: none;
  }

  .section {
    background: var(--background-sec);
    border-radius: 10px;
    padding: 15px;
  }

  .profile {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .profile .avatar {
    border-radius: 50%;
    padding: 10px;
    font-size: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .profile .info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    user-select: text;
  }

  .profile .info p {
    color: var(--text-sec);
    font-size: 14px;
  }

  .profile .inline-field {
    all: unset;
    font-size: 22px;
    font-weight: 600;
    border-bottom: 2px solid var(--border);
    transition: 200ms ease;
    width: 100%;
    max-width: 250px;
  }

  .profile .inline-field:hover {
    border-color: var(--border-sec);
  }

  .profile .inline-field:focus {
    border-color: var(--accent);
  }

  .load {
    animation: spin 1s linear infinite reverse;
  }

  .loader {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
  }
</style>
