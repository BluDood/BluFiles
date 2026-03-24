<script lang="ts">
  import Monaco from '$components/Monaco.svelte'

  import {
    generateSnippet,
    snippetTypes,
    type GeneratedSnippet,
    type SnippetType
  } from '$lib/generators.js'

  let {
    onclose
  }: {
    onclose: () => void
  } = $props()

  function close() {
    closing = true
    setTimeout(() => onclose(), 200)
  }

  let closing = $state(false)

  let snippetType: SnippetType = $state('sharex')
  let generatedSnippet: GeneratedSnippet | null = $state(null)
  let token: string = $state('')

  async function generate() {
    const snippet = await generateSnippet(snippetType, token || '<token>')
    if (!snippet) return

    generatedSnippet = snippet
  }

  async function copy() {
    if (!generatedSnippet) return

    await navigator.clipboard.writeText(generatedSnippet.snippet)
  }

  $effect(() => {
    generate()
  })
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
  <div class="generator">
    <div class="v-align">
      <h1>Generate Snippet</h1>
      <button onclick={() => close()}>
        <span class="material-icons">close</span>
      </button>
    </div>
    <div class="description">
      Generate a code snippet for uploading files using other applications.
    </div>
    <input
      class="token"
      type="password"
      placeholder="Paste your token here..."
      bind:value={token}
      oninput={e =>
        (token = e.currentTarget.value.replace(/[^a-zA-Z0-9]/g, ''))}
    />
    <div class="editor">
      {#if generatedSnippet}
        <div class="monaco">
          <Monaco
            bind:value={generatedSnippet.snippet}
            bind:language={generatedSnippet.language}
            readonly
          />
        </div>
      {/if}
    </div>
    <div class="actions">
      <div class="buttons">
        <button onclick={copy}>
          <span class="material-icons"> content_copy </span>
        </button>
      </div>

      <div class="options">
        <div class="option">
          <p>Generator</p>
          <select bind:value={snippetType}>
            {#each snippetTypes as type}
              <option value={type.key}>
                {type.name}
              </option>
            {/each}
          </select>
        </div>
      </div>
    </div>
  </div>
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

  .generator {
    background: var(--background-sec);
    padding: 10px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    animation: scale 200ms ease;
    transition: 200ms ease;
    max-height: 90%;
    max-width: 90%;
    min-width: 250px;
  }

  .generator .v-align {
    gap: 20px;
  }

  .generator h1 {
    font-size: 28px;
    word-break: break-all;
  }

  .wrapper[data-closing='true'] .generator {
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

  .generator .description {
    color: var(--text-sec);
    font-size: 14px;
    margin-bottom: 10px;
  }

  .generator .token {
    all: unset;
    box-sizing: border-box;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--background-ter);
    color: var(--text);
    width: 100%;
    outline: 1px solid transparent;
    outline-offset: 2px;
    transition: 200ms ease;
  }

  .generator .token:hover {
    background-color: var(--hover);
  }

  .generator .token:focus {
    outline-color: var(--accent);
    background-color: var(--hover);
  }

  .generator .token:not(select):read-only:focus {
    outline-color: var(--outline);
  }

  .generator .monaco {
    margin: 10px 0;
    overflow: hidden;
    border-radius: 5px;
    resize: both;
    width: 800px;
    height: 400px;
    min-width: 350px;
    min-height: 100px;
    max-width: 100%;
    max-height: calc(100vh - 180px);
  }

  .generator .options {
    display: flex;
    gap: 20px;
  }

  .generator .option {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .generator .option p {
    margin: 0;
    font-size: 14px;
    color: var(--text-sec);
  }

  .generator .option select {
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

  .generator .option select:hover {
    background-color: var(--hover);
  }

  .generator .option select:focus {
    outline-color: var(--accent);
    background-color: var(--hover);
  }

  .generator .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .generator .actions .buttons {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .generator .actions .buttons button {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--accent);
  }
</style>
