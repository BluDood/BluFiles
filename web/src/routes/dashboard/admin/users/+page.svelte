<script lang="ts">
  import Loader from '$components/Loader.svelte'
  import { req } from '$lib/utils.js'
  import { onMount } from 'svelte'

  let users: User[] | null = $state(null)
  let loading = $state(true)

  interface User {
    id: string
    username: string
    type: 'user' | 'admin'
  }

  async function load() {
    loading = true
    const res = await req.get('admin/users')
    if (res.status !== 200) {
      users = []
      loading = false
      return
    }

    users = res.data
    loading = false
  }

  onMount(load)
</script>

<main>
  <div class="section">
    <h2>Users</h2>
    <div class="list">
      {#if loading}
        <Loader />
      {:else if users}
        {#each users as user}
          <div class="user">
            <div class="info">
              <div class="username">{user.username}</div>
              {#if user.type === 'admin'}
                <span class="material-icons"> shield </span>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</main>

<style>
  main {
    animation: appear 500ms ease;
  }

  .section {
    background: #111;
    border-radius: 10px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .user {
    padding: 10px;
    background: #222;
    border-radius: 5px;
    display: flex;
    align-items: center;
  }

  .user .info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user .info .username {
    font-weight: bold;
  }

  .user .info .material-icons {
    font-size: 16px;
    color: #0064ff;
  }
</style>
