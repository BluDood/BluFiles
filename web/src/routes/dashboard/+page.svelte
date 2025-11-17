<script lang="ts">
  import { userStore } from '$lib/stores.js'
</script>

{#if $userStore}
  <main>
    <h1>Welcome, {$userStore?.username}!</h1>
  </main>
{/if}

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: appear 500ms ease;
  }
</style>
