<script lang="ts">
  import type { Popup } from '$lib/popups.js'

  let { popup }: { popup: Popup } = $props()
  let inputElement: HTMLInputElement | null = $state(null)
  let selectElement: HTMLSelectElement | null = $state(null)
  let buttonsElement: HTMLDivElement | null = $state(null)

  let input = $derived(
    popup.input?.enabled
      ? popup.input.value || ''
      : popup.select?.enabled
        ? popup.select.value || ''
        : ''
  )

  $effect(() => {
    if (popup.input?.enabled && inputElement) {
      inputElement.focus()
      inputElement.setSelectionRange(0, inputElement.value.length)
    } else if (popup.select?.enabled && selectElement) {
      selectElement.focus()
    } else if (buttonsElement) {
      const firstButton = popup.buttons[0]
      if (firstButton) {
        const button = buttonsElement.querySelector(
          `button[data-color='${firstButton.color}']`
        ) as HTMLButtonElement
        button?.focus()
      }
    }
  })
</script>

<svelte:window
  on:keydown={e => {
    if (e.key === 'Escape') {
      e.preventDefault()
      popup.callback({
        type: popup.dismissValue
      })
    }
  }}
/>

<div class="popup" data-closing={popup.closing}>
  <div class="header">
    <h2 class="title">{popup.title}</h2>
    <button
      onclick={() => {
        popup.callback({
          type: popup.dismissValue
        })
      }}
    >
      <div class="material-icons">close</div>
    </button>
  </div>
  <p class="content">{popup.content}</p>
  {#if popup.input?.enabled}
    <input
      bind:this={inputElement}
      type="text"
      class="input"
      placeholder={popup.input.placeholder}
      bind:value={input}
      readonly={popup.input.readonly}
      onkeydown={e => {
        if (e.key === 'Enter') {
          popup.callback({
            type: popup.buttons[0]?.type || 'submit',
            input
          })
        }
      }}
    />
  {/if}
  {#if popup.select?.enabled}
    <select
      class="input select"
      bind:value={input}
      bind:this={selectElement}
      onkeydown={e => {
        if (e.key === 'Enter') {
          popup.callback({
            type: popup.buttons[0]?.type || 'submit',
            input
          })
        }
      }}
    >
      <option value="" disabled selected hidden>
        {popup.select.placeholder}
      </option>
      {#each popup.select.options as option}
        <option value={option.value}>{option.text}</option>
      {/each}
    </select>
  {/if}
  <div class="buttons" bind:this={buttonsElement}>
    {#each popup.buttons as button}
      <button
        data-color={button.color}
        onclick={() => {
          popup.callback({
            type: button.type,
            input
          })
        }}
      >
        {button.text}
      </button>
    {/each}
  </div>
</div>

<style>
  .popup {
    animation: appear 200ms ease;
    position: absolute;
    background: var(--background-sec);
    padding: 15px;
    border-radius: 5px;
    width: calc(100% - 40px);
    max-width: 400px;
    transition: 200ms ease;
    transition-property: transform, opacity;
  }

  .popup[data-closing='true'] {
    transform: translateY(10px);
    opacity: 0;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    word-break: break-all;
    gap: 20px;
  }

  .header button {
    all: unset;
    cursor: pointer;
    display: flex;

    border-radius: 5px;
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
  }

  .header button:focus {
    color: var(--red);
    outline-color: var(--red);
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    margin-top: 10px;
    gap: 10px;
  }

  .buttons button {
    all: unset;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--button-color, var(--foreground));
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
  }

  .buttons button:hover {
    opacity: 0.8;
  }

  .buttons button:focus {
    outline-color: var(--button-color, var(--outline));
  }

  .buttons button[data-color='blue'] {
    --button-color: var(--accent);
  }

  .buttons button[data-color='red'] {
    --button-color: var(--red);
  }

  .input {
    all: unset;
    box-sizing: border-box;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--background-ter);
    color: var(--text);
    margin-top: 10px;
    width: 100%;
    outline: 1px solid transparent;
    outline-offset: 2px;
    transition: 200ms ease;
  }

  .input:hover {
    background-color: var(--hover);
  }

  .input:focus {
    outline-color: var(--accent);
    background-color: var(--hover);
  }

  .input:not(select):read-only:focus {
    outline-color: var(--outline);
  }

  .select {
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
</style>
