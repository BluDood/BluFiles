<script lang="ts">
  import { onMount } from 'svelte'

  import { userStore } from '$lib/stores'
  import { req } from '$lib/utils'

  import Messages from '$components/Messages.svelte'
  import Titlebar from '$components/Titlebar.svelte'
  import Sidebar from '$components/Sidebar.svelte'
  import Popups from '$components/Popups.svelte'

  onMount(async () => {
    const res = await req.get('/me')
    if (!res) return

    userStore.set(res.data)
  })
</script>

<div class="wrapper">
  <Titlebar />
  <div class="main">
    <Sidebar />
    <div class="slot"><slot /></div>
  </div>
</div>
<Popups />
<Messages />

<style>
  .wrapper {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100vh;
  }

  .main {
    display: grid;
    grid-template-columns: auto 1fr;
    width: 100vw;
  }

  .slot {
    overflow: auto;
    max-height: 100%;
  }

  .slot:not(:has(:first-child[data-no-padding='true'])) {
    padding: 20px;
  }
</style>
