<script lang="ts">
  import { onMount } from 'svelte'

  import { goto } from '$app/navigation'

  import { formatBytes, random, req } from '$lib/utils.js'
  import { createMessage } from '$lib/messages.js'
  import { alert, prompt } from '$lib/popups.js'
  import { userStore } from '$lib/stores.js'

  import Loader from '$components/Loader.svelte'

  let users: User[] | null = $state(null)
  let loading = $state(true)

  interface User {
    id: string
    username: string
    type: 'user' | 'admin'
    usage: number
  }

  async function addUser() {
    const username = await prompt({
      title: 'Add User',
      content: 'Enter the username for the new user:',
      placeholder: 'Username'
    })
    if (!username.type || username.input?.trim() === '') return

    const password = random(16)

    const pass = await prompt({
      title: 'Password',
      content: `Here is the randomly generated password for the user. Copy it now, you won't be able to see it again.`,
      defaultValue: password,
      readonly: true
    })
    if (!pass.type) return

    const res = await req.post('admin/users', {
      username: username.input,
      password: password
    })

    if (res.status !== 201) {
      const messages: Record<number, string> = {
        400: 'Invalid username.',
        403: 'The user limit has been reached.',
        409: 'A user with that username already exists.'
      }

      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: messages[res.status] || 'Please try again later.'
      })
    }

    createMessage({
      title: 'User Created',
      content: 'The user has been created successfully.',
      type: 'success'
    })

    load()
  }

  async function deleteUser(id: string) {
    const confirm = await alert({
      title: 'Delete User',
      content:
        'Are you sure you want to delete this user? All their files, folders, pastes, shares, etc. will be permanently deleted.',
      buttons: [
        {
          text: 'Delete',
          color: 'red'
        },
        {
          text: 'Cancel'
        }
      ]
    })
    if (!confirm.type) return
    const res = await req.delete(`admin/users/${id}`)

    if (res.status !== 204) {
      const messages: Record<number, string> = {}

      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: messages[res.status] || 'Please try again later.'
      })
    }

    createMessage({
      title: 'User Deleted',
      content: 'The user has been deleted successfully.',
      type: 'success'
    })

    load()
  }

  async function setUserAdmin(id: string, isAdmin: boolean) {
    if (isAdmin) {
      const confirm = await alert({
        title: 'Grant Privileges',
        content:
          'Are you sure you want to grant this user admin privileges? They will immediately be able to access the admin dashboard and manage other users.',
        buttons: [
          {
            text: 'Grant',
            color: 'blue'
          },
          {
            text: 'Cancel'
          }
        ]
      })
      if (!confirm.type) return
    } else if (id === $userStore?.id) {
      const confirm = await alert({
        title: 'Revoke Privileges',
        content:
          'Are you sure you want to revoke your own admin privileges? You will immediately lose access to the admin dashboard.',
        buttons: [
          {
            text: 'Revoke',
            color: 'red'
          },
          {
            text: 'Cancel'
          }
        ]
      })
      if (!confirm.type) return
    }

    const res = await req.patch(`admin/users/${id}`, {
      type: isAdmin ? 'admin' : 'user'
    })

    if (res.status !== 204) {
      const messages: Record<number, string> = {}

      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: messages[res.status] || 'Please try again later.'
      })
    }

    createMessage({
      title: 'User Updated',
      content: 'The user was updated successfully.',
      type: 'success'
    })

    if (id === $userStore?.id) {
      userStore.update(u => {
        if (u) u.type = 'user'
        return u
      })
      goto('/dashboard')
    } else {
      load()
    }
  }

  async function load() {
    loading = true
    const res = await req.get('admin/users')
    if (res.status !== 200) {
      users = []
      loading = false
      return
    }

    users = res.data
    loading = false
  }

  onMount(load)
</script>

<main>
  <div class="section">
    <h2>Users</h2>

    <button class="add" onclick={addUser} disabled={loading}> Add User </button>
    <div class="list">
      {#if loading}
        <div class="load">
          <Loader />
        </div>
      {:else if users}
        {#each users as user}
          <div class="user">
            <div class="info">
              <div class="username">{user.username}</div>
              {#if user.type === 'admin'}
                <span class="material-icons"> shield </span>
              {/if}
            </div>
            <div class="right">
              <div class="info">
                <span>{formatBytes(user.usage)}</span>
              </div>
              <div class="actions">
                <button
                  class="action"
                  data-color="blue"
                  onclick={e => {
                    e.stopPropagation()
                    setUserAdmin(user.id, user.type === 'user')
                  }}
                >
                  <span class="material-icons">
                    {user.type === 'admin'
                      ? 'remove_moderator'
                      : 'add_moderator'}
                  </span>
                </button>
                {#if user.id !== $userStore?.id}
                  <button
                    class="action"
                    data-color="red"
                    onclick={e => {
                      e.stopPropagation()
                      deleteUser(user.id)
                    }}
                  >
                    <span class="material-icons"> delete </span>
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
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
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    max-width: 800px;
  }

  .add {
    all: unset;
    position: absolute;
    top: 0;
    right: 0;
    margin: 15px;
    --button-color: #0064ff;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--button-color, #333);
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
    animation: appear 500ms ease;
  }

  .add:hover {
    opacity: 0.8;
  }

  .add:focus {
    outline-color: var(--button-color, #666);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .user {
    padding: 10px;
    background: #222;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: appear 500ms ease;
  }

  .user .info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user .info .username {
    font-weight: bold;
  }

  .user .info .material-icons {
    font-size: 16px;
    color: #0064ff;
  }

  .user .right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-left: 20px;
  }

  .user .info {
    display: flex;
    align-items: center;
    width: max-content;
  }

  .user .info span {
    display: flex;
    align-items: center;
    color: #aaa;
    font-size: 14px;
  }

  .user .info span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
    margin: 0 5px;
  }

  .user .actions {
    display: flex;
    gap: 10px;
    width: max-content;
  }

  .user .actions .action {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: 200ms ease;
  }

  .user .actions .action[data-color='gray'] {
    color: gray;
  }

  .user .actions .action[data-color='blue'] {
    color: #0064ff;
  }

  .user .actions .action[data-color='red'] {
    color: red;
  }

  .user .actions .action[data-color='orange'] {
    color: orange;
  }

  .user .actions .action span {
    font-size: 20px;
  }

  .load {
    display: flex;
    justify-content: center;
    padding: 20px 0;
    animation: appear 200ms ease;
  }
</style>
