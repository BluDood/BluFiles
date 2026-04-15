<script lang="ts">
  import { onMount } from 'svelte'

  import { createMessage } from '$lib/messages.js'
  import { req } from '$lib/utils.js'

  import Loader from '$components/Loader.svelte'
  import Switch from '$components/Switch.svelte'

  let config: Config | null = $state(null)
  let loading = $state(true)

  interface Config {
    maxUsers: number
    disableRegistration: boolean | 'afterFirstUser'
    total: {
      maxFiles: number
      maxFolders: number
      maxPastes: number
      maxCollections: number
      maxShares: number
      maxStorage: number
    }
    user: {
      maxFiles: number
      maxFolders: number
      maxPastes: number
      maxCollections: number
      maxShares: number
      maxTokens: number
      maxStorage: number
    }
  }

  async function update() {
    if (!config) return
    loading = true
    const res = await req.patch('admin/config', {
      ...config,
      user: {
        ...config.user,
        maxStorage: Math.max(-1, config.user.maxStorage * 1024 * 1024)
      },
      total: {
        ...config.total,
        maxStorage: Math.max(-1, config.total.maxStorage * 1024 * 1024)
      }
    })

    loading = false

    if (res.status !== 204) {
      const messages: Record<number, string> = {}

      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: messages[res.status] || 'Please try again later.'
      })
    }

    createMessage({
      title: 'Configuration Updated',
      content: 'The config was updated successfully.',
      type: 'success'
    })
  }

  async function load() {
    loading = true
    const res = await req.get('admin/config')
    if (res.status !== 200) {
      config = null
      loading = false
      return
    }

    config = {
      ...res.data,
      user: {
        ...res.data.user,
        maxStorage:
          res.data.user.maxStorage === -1
            ? -1
            : Math.floor(res.data.user.maxStorage / (1024 * 1024))
      },
      total: {
        ...res.data.total,
        maxStorage:
          res.data.total.maxStorage === -1
            ? -1
            : Math.floor(res.data.total.maxStorage / (1024 * 1024))
      }
    }
    loading = false
  }

  onMount(load)
</script>

<main>
  <div class="section">
    <h2>Configuration</h2>
    <div class="load" data-loading={loading}>
      <Loader />
    </div>
    {#if config}
      <button class="save" onclick={update} disabled={loading}>
        Save Changes
      </button>
      <div class="config">
        <div class="group">
          <h3>Users & Registration</h3>
          <div class="field">
            <span>Limit Users</span>
            <div class="double">
              <Switch
                value={config.maxUsers !== -1}
                onchange={v => (config!.maxUsers = v ? 1 : -1)}
              />
              <input
                class="input"
                type="number"
                bind:value={config.maxUsers}
                data-visible={config.maxUsers !== -1}
                disabled={config.maxUsers === -1}
                min="1"
              />
            </div>
          </div>
          <div class="field">
            <span>Disable Registration</span>
            <select class="input" bind:value={config.disableRegistration}>
              <option value={false}>No</option>
              <option value={true}>Yes</option>
              <option value="afterFirstUser">After First User</option>
            </select>
          </div>
        </div>
        <div class="double-group">
          <div class="group">
            <h3>Default User Limits</h3>
            <div class="field">
              <span>Limit Files</span>
              <div class="double">
                <Switch
                  value={config.user.maxFiles !== -1}
                  onchange={v => (config!.user.maxFiles = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.user.maxFiles}
                  data-visible={config.user.maxFiles !== -1}
                  disabled={config.user.maxFiles === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Folders</span>
              <div class="double">
                <Switch
                  value={config.user.maxFolders !== -1}
                  onchange={v => (config!.user.maxFolders = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.user.maxFolders}
                  data-visible={config.user.maxFolders !== -1}
                  disabled={config.user.maxFolders === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Pastes</span>
              <div class="double">
                <Switch
                  value={config.user.maxPastes !== -1}
                  onchange={v => (config!.user.maxPastes = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.user.maxPastes}
                  data-visible={config.user.maxPastes !== -1}
                  disabled={config.user.maxPastes === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Collections</span>
              <div class="double">
                <Switch
                  value={config.user.maxCollections !== -1}
                  onchange={v => (config!.user.maxCollections = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.user.maxCollections}
                  data-visible={config.user.maxCollections !== -1}
                  disabled={config.user.maxCollections === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Shares</span>
              <div class="double">
                <Switch
                  value={config.user.maxShares !== -1}
                  onchange={v => (config!.user.maxShares = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.user.maxShares}
                  data-visible={config.user.maxShares !== -1}
                  disabled={config.user.maxShares === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Tokens</span>
              <div class="double">
                <Switch
                  value={config.user.maxTokens !== -1}
                  onchange={v => (config!.user.maxTokens = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.user.maxTokens}
                  data-visible={config.user.maxTokens !== -1}
                  disabled={config.user.maxTokens === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Storage (MB)</span>
              <div class="double">
                <Switch
                  value={config.user.maxStorage !== -1}
                  onchange={v => (config!.user.maxStorage = v ? 100 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.user.maxStorage}
                  data-visible={config.user.maxStorage !== -1}
                  disabled={config.user.maxStorage === -1}
                  min="1"
                />
              </div>
            </div>
          </div>
          <div class="group">
            <h3>Total Limits</h3>
            <div class="field">
              <span>Limit Files</span>
              <div class="double">
                <Switch
                  value={config.total.maxFiles !== -1}
                  onchange={v => (config!.total.maxFiles = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.total.maxFiles}
                  data-visible={config.total.maxFiles !== -1}
                  disabled={config.total.maxFiles === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Folders</span>
              <div class="double">
                <Switch
                  value={config.total.maxFolders !== -1}
                  onchange={v => (config!.total.maxFolders = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.total.maxFolders}
                  data-visible={config.total.maxFolders !== -1}
                  disabled={config.total.maxFolders === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Pastes</span>
              <div class="double">
                <Switch
                  value={config.total.maxPastes !== -1}
                  onchange={v => (config!.total.maxPastes = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.total.maxPastes}
                  data-visible={config.total.maxPastes !== -1}
                  disabled={config.total.maxPastes === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Collections</span>
              <div class="double">
                <Switch
                  value={config.total.maxCollections !== -1}
                  onchange={v => (config!.total.maxCollections = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.total.maxCollections}
                  data-visible={config.total.maxCollections !== -1}
                  disabled={config.total.maxCollections === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Shares</span>
              <div class="double">
                <Switch
                  value={config.total.maxShares !== -1}
                  onchange={v => (config!.total.maxShares = v ? 1 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.total.maxShares}
                  data-visible={config.total.maxShares !== -1}
                  disabled={config.total.maxShares === -1}
                  min="1"
                />
              </div>
            </div>
            <div class="field">
              <span>Limit Storage (MB)</span>
              <div class="double">
                <Switch
                  value={config.total.maxStorage !== -1}
                  onchange={v => (config!.total.maxStorage = v ? 100 : -1)}
                />
                <input
                  class="input"
                  type="number"
                  bind:value={config.total.maxStorage}
                  data-visible={config.total.maxStorage !== -1}
                  disabled={config.total.maxStorage === -1}
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
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
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    max-width: 800px;
  }

  .config {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    animation: appear 500ms ease;
  }

  .save {
    all: unset;
    position: absolute;
    top: 0;
    right: 0;
    margin: 15px;
    --button-color: var(--accent);
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--button-color, var(--foreground));
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
    animation: appear 500ms ease;
  }

  .save:hover {
    opacity: 0.8;
  }

  .save:focus {
    outline-color: var(--button-color, var(--outline));
  }

  .double-group {
    display: flex;
    gap: 40px;
  }

  @media (max-width: 600px) {
    .double-group {
      flex-direction: column;
    }
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .double {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .field .input {
    all: unset;
    box-sizing: border-box;
    padding: 5px 10px;
    border-radius: 5px;
    background-color: var(--background-ter);
    color: var(--text);
    width: 100%;
    outline: 1px solid transparent;
    outline-offset: 2px;
    transition: 200ms ease;
    max-width: 300px;
  }

  .field .input:hover {
    background-color: var(--hover);
  }

  .field .input:focus {
    outline-color: var(--accent);
    background-color: var(--foreground);
  }

  .field .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .field .input[data-visible='false'] {
    opacity: 0;
    pointer-events: none;
  }

  .field select.input {
    background-image:
      linear-gradient(45deg, transparent 50%, white 50%),
      linear-gradient(135deg, white 50%, transparent 50%);
    background-position:
      calc(100% - 20px) calc(14px),
      calc(100% - 15px) calc(14px);
    background-size:
      5px 5px,
      5px 5px;
    background-repeat: no-repeat;
    padding-right: 40px;
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
    z-index: 1;
  }

  .load[data-loading='true'] {
    opacity: 1;
    pointer-events: all;
  }
</style>
