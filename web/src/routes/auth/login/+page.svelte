<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { req } from '$lib/utils'

  let loading = false
  let error
  let username
  let password

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
        <p style="color: red;">{error}</p>
      {:else}
        <p>
          Please sign in below. <a href="/auth/register">No account?</a>
        </p>
      {/if}
    </div>
    <div class="field">
      <span>Username</span>
      <input
        disabled={loading}
        bind:value={username}
        type="text"
        placeholder=" "
      />
    </div>
    <div class="field">
      <span>Password</span>
      <input
        disabled={loading}
        bind:value={password}
        type="password"
        placeholder=" "
      />
    </div>
    <button disabled={loading} on:click={login} class="submit"
      >Login</button
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
    align-items: center;
    gap: 10px;
    animation: appear 500ms ease;
  }

  .field {
    position: relative;
    display: flex;
    width: 300px;
  }

  .field input {
    width: 100%;
    background: transparent;
    border: none;
    border: 1px solid #444;
    padding: 15px;
    border-radius: 10px;
    outline: none;
    color: white;
    transition: 200ms ease;
    font-size: 16px;
    transition: 200ms ease;
  }

  .field input:is(:focus, :not(:placeholder-shown)) {
    border-color: #0064ff;
  }

  .field span {
    position: absolute;
    top: 50%;
    left: 15px;
    transform: translateY(-50%);
    transition: 200ms ease;
    background: #000;
    padding: 0 5px;
    color: #666;
    pointer-events: none;
    border-radius: 9999px;
    z-index: 10;
  }

  .field:has(input:is(:focus, :not(:placeholder-shown))) span {
    font-size: 14px;
    transform: translateY(0);
    top: -8px;
    color: #0064ff;
  }

  .field input:disabled {
    opacity: 0.5;
  }

  .submit {
    all: unset;
    background: #0064ff;
    border-radius: 8px;
    padding: 10px 0;
    width: 100%;
    text-align: center;
    opacity: 0.8;
    transition: 200ms ease;
    cursor: pointer;
    transition: 200ms ease;
  }

  .submit:hover {
    opacity: 1;
  }

  .submit:disabled {
    opacity: 0.5;
  }
</style>
