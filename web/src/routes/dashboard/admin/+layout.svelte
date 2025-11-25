<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'

  import { userStore } from '$lib/stores.js'

  const tabs = [
    {
      name: 'Users',
      path: '/dashboard/admin/users'
    },
    {
      name: 'Total Usage',
      path: '/dashboard/admin/usage'
    },
    {
      name: 'Configuration',
      path: '/dashboard/admin/config'
    }
  ]

  $effect(() => {
    if (!$userStore) return
    if ($userStore.type !== 'admin') goto('/dashboard')
  })
</script>

<main>
  <h2>Admin</h2>
  <div class="tabs">
    {#each tabs as tab}
      <a href={tab.path} class:active={page.url.pathname.startsWith(tab.path)}>
        {tab.name}
      </a>
    {/each}
  </div>
  <slot />
</main>

<style>
  main {
    animation: appear 500ms ease;
  }

  .tabs {
    display: flex;
    margin: 10px 0;
  }

  .tabs a {
    display: block;
    padding: 5px 15px;
    color: #fff;
    border-bottom: 1px solid transparent;
    transition: 200ms ease;
  }

  .tabs a:hover {
    border-color: #333;
  }

  .tabs a.active {
    border-color: #0064ff;
  }
</style>
