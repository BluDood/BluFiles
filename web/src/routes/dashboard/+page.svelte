<script lang="ts">
  import { userStore } from '$lib/stores.js'

  import Loader from '$components/Loader.svelte'
</script>

{#if $userStore}
  <main>
    <h1>Welcome, {$userStore?.username}!</h1>
    <div class="links">
      <a href="/dashboard/files">
        <span class="material-icons"> folder_open </span>
        Files
      </a>
      <a href="/dashboard/pastes">
        <span class="material-icons"> content_paste </span>
        Pastes
      </a>
      <a href="/dashboard/collections">
        <span class="material-icons"> collections </span>
        Collections
      </a>
      <a href="/dashboard/sharing">
        <span class="material-icons"> share </span>
        Sharing
      </a>
      <a href="/dashboard/usage">
        <span class="material-icons"> bar_chart </span>
        Usage
      </a>
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

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .links a {
    all: unset;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: #222;
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .links a:hover {
    opacity: 0.8;
  }

  .links a:focus {
    outline-color: #555;
  }

  .loader {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
  }
</style>
