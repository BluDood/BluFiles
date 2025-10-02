<script lang="ts">
  import { req } from '$lib/utils'

  let currentPassword = $state('')
  let newPassword = $state('')
  let confirmPassword = $state('')
  let passLoading = $state(false)

  async function changePassword() {
    if (newPassword.length < 8)
      return alert('Password must be at least 8 characters long')
    if (newPassword !== confirmPassword) return alert('Passwords do not match')

    passLoading = true

    const res = await req.patch('me/password', {
      currentPassword,
      newPassword
    })

    if (res.status === 200) {
      currentPassword = ''
      newPassword = ''
      confirmPassword = ''
    }

    passLoading = false
  }
</script>

<main>
  <div class="section pass">
    <h2>Change Password</h2>
    <input
      type="password"
      bind:value={currentPassword}
      placeholder="Current Password"
    />
    <input
      type="password"
      bind:value={newPassword}
      placeholder="New Password"
    />
    <input
      type="password"
      bind:value={confirmPassword}
      placeholder="Confirm Password"
    />
    <button
      onclick={changePassword}
      disabled={passLoading ||
        !currentPassword ||
        !newPassword ||
        !confirmPassword ||
        newPassword !== confirmPassword}
    >
      {#if passLoading}
        <span class="material-icons load"> sync </span>
      {:else}
        Change Password
      {/if}
    </button>
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
  }

  .pass {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .pass input {
    all: unset;
    padding: 10px;
    max-width: 400px;
    width: calc(100% - 20px);
    border-radius: 5px;
    background: #222;
    font-size: 16px;
    transition: 200ms ease;
  }

  .pass input:hover {
    background: #282828;
  }

  .pass input:focus {
    background: #333;
  }

  .pass button {
    all: unset;
    display: flex;
    justify-content: center;
    padding: 10px;
    max-width: 400px;
    width: calc(100% - 20px);
    text-align: center;
    border-radius: 5px;
    background: #0064ff;
    font-size: 16px;
    transition: 200ms ease;
    cursor: pointer;
  }

  .pass button:hover {
    background: #0050e6;
  }

  .pass button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
