<script lang="ts">
  import { onMount } from 'svelte'

  import { createMessage } from '$lib/messages.js'
  import { formatBytes, req } from '$lib/utils'
  import { alert } from '$lib/popups'

  import Progress from '$components/Progress.svelte'
  import Loader from '$components/Loader.svelte'
  import Switch from '$components/Switch.svelte'
  import { userStore } from '$lib/stores.js'
  import { goto } from '$app/navigation'

  let {
    id,
    onclose
  }: {
    id: string
    onclose: (reload: boolean) => void
  } = $props()

  let closing = $state(false)
  let loading = $state(true)
  let error: string | null = $state(null)
  let editLimits = $state(false)

  interface UserInfo {
    id: string
    username: string
    type: 'user' | 'admin'
    storage: {
      current: number
      max?: number
    }
    files: {
      current: number
      max?: number
    }
    folders: {
      current: number
      max?: number
    }
    pastes: {
      current: number
      max?: number
    }
    collections: {
      current: number
      max?: number
    }
    shares: {
      current: number
      max?: number
    }
    tokens: {
      current: number
      max?: number
    }
  }

  let info: UserInfo | null = $state(null)

  function close(reload = false) {
    closing = true
    setTimeout(() => onclose(reload), 200)
  }

  async function deleteUser() {
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
    const res = await req.delete(`admin/users/${info!.id}`)

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

    close(true)
  }

  async function setUserAdmin(isAdmin: boolean) {
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
    } else if (info!.id === $userStore?.id) {
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

    const res = await req.patch(`admin/users/${info!.id}`, {
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

  async function toggleEditLimits() {
    if (editLimits) {
      const res = await req.patch(`admin/users/${info!.id}`, {
        storageLimit: info?.storage.max ?? null,
        fileLimit: info?.files.max ?? null,
        folderLimit: info?.folders.max ?? null,
        pasteLimit: info?.pastes.max ?? null,
        collectionLimit: info?.collections.max ?? null,
        shareLimit: info?.shares.max ?? null
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
        title: 'User Limits Updated',
        content: 'The user was updated successfully.',
        type: 'success'
      })

      load()
    }

    editLimits = !editLimits
  }

  async function load() {
    error = null

    const res = await req.get(`admin/users/${id}`)
    if (res.status !== 200) {
      if (res.status === 404) error = 'The user was not found.'
      else error = 'Please try again later.'
      loading = false
      return
    }

    info = {
      ...res.data,
      storage: {
        current: Number(res.data.storage.current),
        max: res.data.storage.max ? Number(res.data.storage.max) : undefined
      }
    }

    loading = false
  }

  onMount(load)
</script>

<div
  class="wrapper"
  data-closing={closing}
  onmousedown={e => {
    if (e.target === e.currentTarget) close()
  }}
  role="dialog"
  tabindex="-1"
>
  {#if loading}
    <Loader />
  {:else if error}
    <div class="error">
      <span class="material-icons"> error_outline </span>
      <h2>An error has occurred!</h2>
      <p>{error}</p>
      <div class="buttons">
        <button onclick={() => close(true)}>
          <div class="material-icons">close</div>
          Close
        </button>
      </div>
    </div>
  {:else if info}
    <div class="userview">
      <div class="v-align">
        <button onclick={() => close()}>
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="details">
        <span class="avatar material-icons"> person </span>
        <div class="info">
          <h2>
            {info.username}
            {#if info.type === 'admin'}
              <span class="material-icons"> shield </span>
            {/if}
          </h2>
          <p>{info.id}</p>
        </div>
      </div>
      <div class="stats" data-edit-limits={editLimits}>
        <div class="item">
          <div class="card">
            <h2>Storage</h2>
            <p>
              {formatBytes(info.storage.current)}{info.storage.max !== undefined
                ? ` / ${formatBytes(info.storage.max)}`
                : ''}
            </p>
            {#if info.storage.max}
              <Progress max={info.storage.max} value={info.storage.current} />
            {/if}
          </div>
          <div class="edit">
            <Switch
              value={info.storage.max !== undefined}
              onchange={v =>
                (info!.storage.max = v ? (info!.storage.max ?? 0) : undefined)}
            />
            <input
              class="input"
              type="number"
              bind:value={
                () =>
                  info!.storage.max
                    ? info!.storage.max / 1024 / 1024
                    : undefined,
                v => {
                  const num = Number(v)
                  if (isNaN(num)) return (info!.storage.max = undefined)
                  info!.storage.max = num * 1024 * 1024
                }
              }
              data-visible={info.storage.max !== undefined}
              disabled={info.storage.max === undefined}
              min="0"
            />
          </div>
        </div>
        <div class="item">
          <div class="card">
            <h2>Files</h2>
            <p>
              {info.files.current}{info.files.max !== undefined
                ? ` / ${info.files.max}`
                : ''}
            </p>
            {#if info.files.max}
              <Progress max={info.files.max} value={info.files.current} />
            {/if}
          </div>
          <div class="edit">
            <Switch
              value={info.files.max !== undefined}
              onchange={v =>
                (info!.files.max = v ? (info!.files.max ?? 0) : undefined)}
            />
            <input
              class="input"
              type="number"
              bind:value={info.files.max}
              data-visible={info.files.max !== undefined}
              disabled={info.files.max === undefined}
              min="0"
            />
          </div>
        </div>
        <div class="item">
          <div class="card">
            <h2>Folders</h2>
            <p>
              {info.folders.current}{info.folders.max !== undefined
                ? ` / ${info.folders.max}`
                : ''}
            </p>
            {#if info.folders.max}
              <Progress max={info.folders.max} value={info.folders.current} />
            {/if}
          </div>
          <div class="edit">
            <Switch
              value={info.folders.max !== undefined}
              onchange={v =>
                (info!.folders.max = v ? (info!.folders.max ?? 0) : undefined)}
            />
            <input
              class="input"
              type="number"
              bind:value={info.folders.max}
              data-visible={info.folders.max !== undefined}
              disabled={info.folders.max === undefined}
              min="0"
            />
          </div>
        </div>
        <div class="item">
          <div class="card">
            <h2>Pastes</h2>
            <p>
              {info.pastes.current}{info.pastes.max !== undefined
                ? ` / ${info.pastes.max}`
                : ''}
            </p>
            {#if info.pastes.max}
              <Progress max={info.pastes.max} value={info.pastes.current} />
            {/if}
          </div>
          <div class="edit">
            <Switch
              value={info.pastes.max !== undefined}
              onchange={v =>
                (info!.pastes.max = v ? (info!.pastes.max ?? 0) : undefined)}
            />
            <input
              class="input"
              type="number"
              bind:value={info.pastes.max}
              data-visible={info.pastes.max !== undefined}
              disabled={info.pastes.max === undefined}
              min="0"
            />
          </div>
        </div>
        <div class="item">
          <div class="card">
            <h2>Collections</h2>
            <p>
              {info.collections.current}{info.collections.max !== undefined
                ? ` / ${info.collections.max}`
                : ''}
            </p>
            {#if info.collections.max}
              <Progress
                max={info.collections.max}
                value={info.collections.current}
              />
            {/if}
          </div>
          <div class="edit">
            <Switch
              value={info.collections.max !== undefined}
              onchange={v =>
                (info!.collections.max = v
                  ? (info!.collections.max ?? 0)
                  : undefined)}
            />
            <input
              class="input"
              type="number"
              bind:value={info.collections.max}
              data-visible={info.collections.max !== undefined}
              disabled={info.collections.max === undefined}
              min="0"
            />
          </div>
        </div>
        <div class="item">
          <div class="card">
            <h2>Shared Items</h2>
            <p>
              {info.shares.current}{info.shares.max !== undefined
                ? ` / ${info.shares.max}`
                : ''}
            </p>
            {#if info.shares.max}
              <Progress max={info.shares.max} value={info.shares.current} />
            {/if}
          </div>
          <div class="edit">
            <Switch
              value={info.shares.max !== undefined}
              onchange={v =>
                (info!.shares.max = v ? (info!.shares.max ?? 0) : undefined)}
            />
            <input
              class="input"
              type="number"
              bind:value={info.shares.max}
              data-visible={info.shares.max !== undefined}
              disabled={info.shares.max === undefined}
              min="0"
            />
          </div>
        </div>
      </div>
      <div class="actions">
        <div class="buttons">
          <button
            onclick={() => setUserAdmin(info!.type === 'user')}
            data-color="blue"
          >
            <span class="material-icons">
              {info.type === 'admin'
                ? 'remove_moderator'
                : 'add_moderator'}</span
            >
          </button>
          {#if info.id !== $userStore?.id}
            <button onclick={deleteUser} data-color="red">
              <span class="material-icons">delete</span>
            </button>
          {/if}
        </div>
        <button class="limits" onclick={toggleEditLimits}>
          <span class="material-icons">
            {editLimits ? 'check' : 'edit'}
          </span>
          {editLimits ? 'Save Limits' : 'Edit Limits'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    z-index: 5;
    transition: 200ms ease;
    animation: opacity 200ms ease;
  }

  @keyframes opacity {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .wrapper[data-closing='true'] {
    opacity: 0;
    pointer-events: none;
  }

  .userview {
    background: var(--background-sec);
    padding: 10px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    animation: scale 200ms ease;
    transition: 200ms ease;
    max-height: 90%;
    max-width: 90%;
    width: 768px;
    position: relative;
    overflow-y: auto;
  }

  .userview .v-align {
    position: absolute;
    right: 10px;
    gap: 20px;
  }

  .wrapper[data-closing='true'] .userview {
    transform: scale(0.8);
  }

  @keyframes scale {
    from {
      transform: scale(0.8);
    }
    to {
      transform: scale(1);
    }
  }

  .userview .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 10px;
  }

  .userview .actions .buttons {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .userview .actions .buttons button {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 3px;
  }

  .userview .actions .buttons button[data-color='red'] {
    color: var(--red);
  }

  .userview .actions .buttons button[data-color='blue'] {
    color: var(--accent);
  }

  .userview .actions .limits {
    all: unset;
    --button-color: var(--accent);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 5px;
    background: var(--button-color, var(--foreground));
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
  }

  .userview .actions .limits:hover {
    opacity: 0.8;
  }

  .userview .actions .limits:focus {
    outline-color: var(--button-color, var(--outline));
  }

  .userview .actions .limits {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: var(--background-sec);
    padding: 20px 30px;
    border-radius: 10px;
    animation: scale 200ms ease;
    transition: 200ms ease;
  }

  .wrapper[data-closing='true'] .error {
    transform: scale(0.8);
  }

  .error > .material-icons {
    font-size: 48px;
    color: var(--red);
  }

  .error .buttons {
    display: flex;
    flex-wrap: wrap;
    margin-top: 10px;
    gap: 10px;
  }

  .error .buttons button {
    all: unset;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--accent);
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .error .buttons button:hover {
    opacity: 0.8;
  }

  .error .buttons button:focus {
    outline-color: var(--accent);
  }

  .details {
    display: flex;
    align-items: center;
    gap: 15px;
    background: var(--background-sec);
    border-radius: 10px;
    padding: 15px;
  }

  .details .avatar {
    border-radius: 50%;
    padding: 10px;
    font-size: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .details .info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    user-select: text;
  }

  .details .info h2 {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .details .info h2 .material-icons {
    font-size: 22px;
    color: var(--accent);
    margin-bottom: 1px;
  }

  .details .info p {
    color: var(--text-sec);
    font-size: 14px;
  }

  .stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
    margin: 0 10px;
  }

  .stats .item {
    display: flex;
    flex-direction: column;
  }

  .stats .item .card {
    width: 230px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    background: var(--background-ter);
    padding: 15px;
    border-radius: 10px;
    height: 100%;
  }

  .stats .item .card:has(:global(.progress)) p {
    margin-bottom: 5px;
  }

  .stats .item .edit {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 0;
    opacity: 0;
    transition: 200ms ease;
  }

  .stats[data-edit-limits='true'] .item .edit {
    height: 30px;
    margin-top: 5px;
    opacity: 1;
  }

  .stats .item .edit .input {
    all: unset;
    box-sizing: border-box;
    padding: 5px 10px;
    border-radius: 5px;
    background-color: var(--background-ter);
    color: var(--text);
    width: 0;
    flex: 1;
    outline: 1px solid transparent;
    outline-offset: 2px;
    transition: 200ms ease;
  }

  .stats .item .edit .input:hover {
    background-color: var(--hover);
  }

  .stats .item .edit .input:focus {
    outline-color: var(--accent);
    background-color: var(--foreground);
  }

  .stats .item .edit .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .stats .item .edit .input[data-visible='false'] {
    opacity: 0;
    pointer-events: none;
  }

  @media (max-width: 600px) {
    .stats {
      flex-wrap: nowrap;
      flex-direction: column;
    }

    .stats .item .card {
      width: 100%;
    }
  }
</style>
