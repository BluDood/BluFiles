<script lang="ts">
  import { onMount } from 'svelte'

  import { goto } from '$app/navigation'

  import { req } from '$lib/utils'

  import Loader from '$components/Loader.svelte'

  let loading = $state(false)
  let error: string | null = $state(null)
  let username: string = $state('')
  let password: string = $state('')

  async function login() {
    if (!username || !password) {
      error = 'Please fill out all fields'
      return
    }

    if (username.length < 3 || password.length < 8) {
      error = 'Invalid username or password'
      return
    }

    loading = true
    error = null

    const res = await req.post(
      'auth/login',
      {
        username,
        password
      },
      {
        no401Redirect: true
      }
    )

    if (res.status === 200) {
      localStorage.setItem('token', res.data.token)
      goto('/dashboard')
    } else {
      error = res.data
    }

    loading = false
  }

  onMount(() => {
    if (localStorage.getItem('token')) {
      goto('/dashboard')
    }
  })
</script>

<svelte:window on:keydown={e => e.key === 'Enter' && login()} />

<div class="wrapper">
  <div class="form">
    <div class="text">
      <h2>Welcome to BluFiles!</h2>
      {#if error}
        <p class="error">{error}</p>
      {:else}
        <p>
          Please sign in below. <a href="/auth/register">No account?</a>
        </p>
      {/if}
    </div>
    <div class="inputs">
      <input
        class="input"
        disabled={loading}
        bind:value={username}
        type="text"
        placeholder="Username"
      />
      <input
        class="input"
        disabled={loading}
        bind:value={password}
        type="password"
        placeholder="Password"
      />
      <div class="load" data-loading={loading}>
        <Loader />
      </div>
    </div>
    <button
      disabled={loading || !username || !password}
      onclick={login}
      class="submit">Login</button
    >
  </div>
</div>

<style>
  .text {
    display: flex;
    gap: 5px;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 10px;
  }

  .wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: appear 500ms ease;
    width: 300px;
    position: relative;
  }

  .inputs {
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    flex: 1;
  }

  .load {
    position: absolute;
    top: -5px;
    left: -5px;
    width: calc(100% + 10px);
    height: calc(100% + 10px);
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    opacity: 0;
    transition: 200ms ease;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(5px);
  }

  .load[data-loading='true'] {
    opacity: 1;
    pointer-events: all;
  }

  .input {
    all: unset;
    padding: 10px;
    flex: 1;
    border-radius: 5px;
    background: var(--background-ter);
    transition: 200ms ease;
  }

  .input:hover {
    background: var(--hover);
  }

  .input:focus {
    background: var(--foreground);
  }

  .submit {
    all: unset;
    display: flex;
    justify-content: center;
    padding: 10px;
    flex: 1;
    text-align: center;
    border-radius: 5px;
    background: var(--accent);
    font-size: 16px;
    transition: 200ms ease;
    cursor: pointer;
  }

  .submit:hover {
    background: var(--hover-accent);
  }

  .submit:disabled {
    background: var(--accent);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    color: var(--red);
  }
</style>
