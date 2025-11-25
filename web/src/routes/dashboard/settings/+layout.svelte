<script lang="ts">
  let { children } = $props()

  import { page } from '$app/state'

  const tabs = [
    {
      name: 'Password',
      path: '/dashboard/settings/password'
    },
    {
      name: 'Danger Zone',
      path: '/dashboard/settings/danger'
    }
  ]
</script>

<main>
  <h2>Settings</h2>
  <div class="tabs">
    {#each tabs as tab}
      <a href={tab.path} class:active={page.url.pathname.startsWith(tab.path)}>
        {tab.name}
      </a>
    {/each}
  </div>
  {@render children()}
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
    color: var(--text);
    border-bottom: 1px solid transparent;
    transition: 200ms ease;
  }

  .tabs a:hover {
    border-color: var(--border-sec);
  }

  .tabs a.active {
    border-color: var(--accent);
  }
</style>
