<script lang="ts">
  import { onMount } from 'svelte'

  import { req } from '$lib/utils.js'

  import Loader from '$components/Loader.svelte'

  interface User {
    id: string
    name: string
  }

  let user: User | null = $state(null)
  let loading = $state(false)

  onMount(async () => {
    const token = localStorage.getItem('token')

    if (token) {
      loading = true
      const res = await req.get('/', {
        no401Redirect: true
      })

      if (res.status === 200) user = res.data.user
      loading = false
    }
  })
</script>

<main>
  <div class="title">
    <img src="/assets/BluFilesSquare.png" alt="" />
    <div class="text">BluFiles</div>
  </div>
  {#if loading}
    <Loader />
  {:else}
    {#if user}
      <p>Welcome back, {user.name}!</p>
    {/if}
    <div class="buttons">
      {#if user}
        <a href="/dashboard" class="button" data-color="blue">Dashboard</a>
      {:else}
        <a href="/auth/login" class="button" data-color="blue">Sign in</a>
        <a href="/auth/register" class="button" data-color="blue">Register</a>
      {/if}
      <a href="https://github.com/BluDood/BluFiles" class="button">GitHub</a>
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100svh;
    gap: 20px;
    animation: appear 500ms ease;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .title img {
    height: 64px;
    width: 64px;
  }

  .title .text {
    font-size: 40px;
    font-weight: bold;
  }

  main p {
    font-size: 18px;
    animation: appear 500ms ease;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    animation: appear 500ms ease;
  }

  .buttons .button {
    all: unset;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--button-color, #333);
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
  }

  .buttons .button:hover {
    opacity: 0.8;
  }

  .buttons .button:focus {
    outline-color: var(--button-color, #666);
  }

  .buttons .button[data-color='blue'] {
    --button-color: #0064ff;
  }
</style>
