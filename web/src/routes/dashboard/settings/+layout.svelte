<script>
  import { page } from '$app/stores'

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
      <a href={tab.path} class:active={tab.path === $page.url.pathname}>
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

  .tabs a.active {
    border-color: #333;
  }
</style>
