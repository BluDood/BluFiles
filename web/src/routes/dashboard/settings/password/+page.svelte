<script lang="ts">
  import { createMessage } from '$lib/messages.js'
  import { req } from '$lib/utils'

  import Loader from '$components/Loader.svelte'

  let currentPassword = $state('')
  let newPassword = $state('')
  let confirmPassword = $state('')

  let loading = $state(false)

  async function changePassword() {
    if (newPassword.length < 8)
      return createMessage({
        type: 'error',
        title: 'Invalid Password',
        content: 'Password must be at least 8 characters'
      })
    if (newPassword !== confirmPassword)
      return createMessage({
        type: 'error',
        title: 'Invalid Password',
        content: 'Passwords do not match'
      })

    loading = true
    const res = await req.patch(
      'me/password',
      {
        currentPassword,
        newPassword
      },
      {
        no401Redirect: true
      }
    )

    loading = false

    if (res.status !== 204) {
      const messages: Record<number, string> = {
        409: 'New password must be different.',
        401: 'Your current password is incorrect.',
        400: 'Your password is invalid.'
      }

      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: messages[res.status] || 'Please try again later.'
      })
    }

    currentPassword = ''
    newPassword = ''
    confirmPassword = ''

    createMessage({
      title: 'Password Updated!',
      type: 'success',
      content: 'Your password has been successfully updated.'
    })
  }
</script>

<main>
  <div class="section pass">
    <h2>Change Password</h2>
    <div class="inputs">
      <input
        type="password"
        bind:value={currentPassword}
        disabled={loading}
        placeholder="Current Password"
      />
      <input
        type="password"
        bind:value={newPassword}
        disabled={loading}
        placeholder="New Password"
      />
      <input
        type="password"
        bind:value={confirmPassword}
        disabled={loading}
        placeholder="Confirm Password"
      />
      <div class="load" data-loading={loading}>
        <Loader />
      </div>
    </div>
    <button
      onclick={changePassword}
      disabled={loading || !currentPassword || !newPassword || !confirmPassword}
    >
      Change Password
    </button>
  </div>
</main>

<style>
  main {
    animation: appear 500ms ease;
  }

  .section {
    background: var(--background-sec);
    border-radius: 10px;
    padding: 15px;
  }

  .pass {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .inputs {
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    max-width: 400px;
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

  .pass input {
    all: unset;
    padding: 10px;
    border-radius: 5px;
    background: var(--background-ter);
    font-size: 16px;
    transition: 200ms ease;
  }

  .pass input:hover {
    background: var(--hover);
  }

  .pass input:focus {
    background: var(--foreground);
  }

  .pass button {
    all: unset;
    display: flex;
    justify-content: center;
    padding: 10px;
    max-width: 380px;
    flex: 1;
    text-align: center;
    border-radius: 5px;
    background: var(--accent);
    font-size: 16px;
    transition: 200ms ease;
    cursor: pointer;
  }

  .pass button:hover {
    background: var(--hover-accent);
  }

  .pass button:disabled {
    background: var(--accent);
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
