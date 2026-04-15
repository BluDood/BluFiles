<script lang="ts">
  import { onMount } from 'svelte'

  import { formatDate, req, resolveLanguage } from '$lib/utils'
  import { LANGUAGE_MAPPINGS } from '$lib/constants.js'
  import { createMessage } from '$lib/messages.js'
  import { shareItem } from '$lib/share.js'
  import { alert } from '$lib/popups'

  import Loader from './Loader.svelte'
  import Monaco from './Monaco.svelte'

  let {
    id,
    isNewPaste = false,
    onclose
  }: {
    id: string
    isNewPaste?: boolean
    onclose: (reload?: boolean) => void
  } = $props()

  let closing = $state(false)
  let loading = $state(true)
  let error: string | null = $state(null)

  interface PasteInfo {
    id: string
    name: string
    type: string
    content: string
    createdAt: string
    updatedAt: string
    shareId: string | null
  }
  let info: PasteInfo | null = $state(null)
  let editing = $state(false)
  let edited = $state(false)
  let content: string = $state('')
  let language: string = $state('')
  let readonly: boolean = $derived(!editing)

  function close(c: boolean = false) {
    closing = true
    setTimeout(() => {
      closing = false
      onclose(edited || c)
    }, 200)
  }

  async function load() {
    const res = await req.get(`paste/${id}`)
    if (res.status !== 200) {
      if (res.status === 404) error = 'The paste was not found.'
      else error = 'Please try again later.'
      loading = false
      return
    }

    info = res.data
    content = info!.content
    language = info!.type
    loading = false

    if (isNewPaste) {
      editing = true
      language = 'auto'
    }
  }

  async function share() {
    const res = await shareItem({
      shareId: info?.shareId || null,
      type: 'paste',
      id: info!.id,
      name: info!.name
    })

    if (!res) return
    if (res.type === 'deleted') {
      info!.shareId = null
    } else if (res.type === 'created') {
      info!.shareId = res.shareId
    }
  }

  async function del() {
    const confirmed = await alert({
      title: 'Delete Paste',
      content: 'Are you sure you want to delete this paste?',
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
    if (!confirmed.type) return

    const res = await req.delete(`paste/${id}`)
    if (!res) return

    if (res.status !== 204)
      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    close(true)
  }

  async function edit() {
    const res = await req.patch(`paste/${id}`, {
      content: info!.content !== content ? content : undefined,
      type: info!.type !== language ? language : undefined
    })
    if (!res) return

    if (res.status !== 200)
      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    info = res.data
    info!.content = content
    language = info!.type

    editing = false
    edited = true
  }

  $effect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 's' && editing) {
          e.preventDefault()
          edit()
        }
      }
    }

    window.addEventListener('keydown', listener)

    return () => window.removeEventListener('keydown', listener)
  })

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
    <div class="pasteview" data-editing={editing}>
      <div class="v-align">
        <h1>{info.name}</h1>
        <button onclick={() => close()}>
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="details">
        <span>{formatDate(info.updatedAt)}</span>
        <span>{resolveLanguage(language)?.name || 'Unknown'}</span>
      </div>
      <div class="editor">
        <div class="monaco">
          <Monaco bind:value={content} bind:language bind:readonly />
        </div>
      </div>
      <div class="actions">
        <div class="buttons">
          {#if editing}
            <button onclick={edit} data-color="green">
              <span class="material-icons">done</span>
            </button>
            <button
              onclick={() => {
                editing = false
                content = info!.content
                language = info!.type
              }}
              data-color="red"
            >
              <span class="material-icons">close</span>
            </button>
          {:else}
            <button onclick={share} data-color={info.shareId ? 'blue' : 'gray'}>
              <span class="material-icons">share</span>
            </button>
            <button onclick={() => (editing = true)} data-color="orange">
              <span class="material-icons">edit</span>
            </button>
            <button onclick={del} data-color="red">
              <span class="material-icons">delete</span>
            </button>
          {/if}
        </div>

        <div class="options">
          <div class="option">
            <p>Language</p>
            <select bind:value={language}>
              <option value="auto">Auto</option>
              {#each Object.entries(LANGUAGE_MAPPINGS) as lang}
                <option value={lang[0]}>
                  {lang[1].name}
                </option>
              {/each}
            </select>
          </div>
        </div>
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

  .pasteview {
    background: var(--background-sec);
    padding: 10px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    animation: scale 200ms ease;
    transition: 200ms ease;
    max-height: calc(100% - 50px);
    overflow: hidden;
    max-width: calc(100% - 50px);
  }

  .pasteview h1 {
    font-size: 28px;
  }

  .wrapper[data-closing='true'] .pasteview {
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

  .pasteview .details {
    display: flex;
    align-items: center;
  }

  .pasteview .details span {
    display: flex;
    align-items: center;
    color: var(--text-sec);
    font-size: 14px;
  }

  .pasteview .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-sec);
    margin: 0 5px;
  }

  .pasteview .editor {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
    margin: 10px 0;
  }

  .pasteview .monaco {
    overflow: hidden;
    border-radius: 10px;
    resize: both;
    width: 800px;
    height: 400px;
    min-width: 350px;
    min-height: 100px;
    max-width: 100%;
    max-height: calc(100vh - 180px);
  }

  .pasteview .options {
    display: flex;
    gap: 20px;
    transition: 200ms ease;
    opacity: 0;
    pointer-events: none;
  }

  .pasteview[data-editing='true'] .options {
    opacity: 1;
    pointer-events: auto;
  }

  .pasteview .option {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pasteview .option p {
    margin: 0;
    font-size: 14px;
    color: var(--text-sec);
  }

  .pasteview .option select {
    all: unset;
    padding: 5px 10px;
    font-size: 16px;
    border-radius: 5px;
    background: var(--background-ter);
    color: var(--text);
    outline: 1px solid transparent;
    outline-offset: 2px;
    transition: 200ms ease;
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

  .pasteview .option select:hover {
    background-color: var(--hover);
  }

  .pasteview .option select:focus {
    outline-color: var(--accent);
    background-color: var(--hover);
  }

  .pasteview .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .pasteview .actions .buttons {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pasteview .actions .buttons button {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .pasteview .actions .buttons button[data-color='gray'] {
    color: var(--text-ter);
  }

  .pasteview .actions .buttons button[data-color='red'] {
    color: var(--red);
  }

  .pasteview .actions .buttons button[data-color='green'] {
    color: var(--green);
  }

  .pasteview .actions .buttons button[data-color='blue'] {
    color: var(--accent);
  }

  .pasteview .actions .buttons button[data-color='orange'] {
    color: var(--orange);
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
</style>
