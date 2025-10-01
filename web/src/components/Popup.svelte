<script>
  export let popup

  let input = popup.input.enabled
    ? popup.input.value || ''
    : popup.select.enabled
      ? popup.select.value || ''
      : ''
</script>

<svelte:window
  on:keydown={e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const firstButton = popup.buttons[0]
      popup.callback({
        type: firstButton.type,
        input: input
      })
    } else if (e.key === 'Escape') {
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
      on:click={() => {
        popup.callback({
          type: popup.dismissValue
        })
      }}
    >
      <div class="material-icons">close</div>
    </button>
  </div>
  <p class="content">{popup.content}</p>
  {#if popup.input.enabled}
    <input
      type="text"
      class="input"
      placeholder={popup.input.placeholder}
      bind:value={input}
      readonly={popup.input.readonly}
    />
  {/if}
  {#if popup.select.enabled}
    <select class="input" bind:value={input}>
      <option value="" disabled selected hidden>
        {popup.select.placeholder}
      </option>
      {#each popup.select.options as option}
        <option value={option.value}>{option.text}</option>
      {/each}
    </select>
  {/if}
  <div class="buttons">
    {#each popup.buttons as button}
      <button
        data-color={button.color}
        on:click={() => {
          popup.callback({
            type: button.type,
            input: input
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
    background: #111;
    padding: 15px;
    border-radius: 5px;
    width: 100%;
    max-width: 400px;
    transition: 200ms ease;
  }

  .popup[data-closing='true'] {
    transform: translateY(10px);
    opacity: 0;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header button {
    all: unset;
    cursor: pointer;
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
    background: #333;
    transition: 200ms ease;
  }

  .buttons button:hover {
    background: #222;
  }

  .buttons button[data-color='blue'] {
    background: #0064ff;
  }

  .buttons button[data-color='blue']:hover {
    background: #004fc7;
  }

  .buttons button[data-color='red'] {
    background: #ff0000;
  }

  .buttons button[data-color='red']:hover {
    background: #c70000;
  }

  .input {
    all: unset;
    box-sizing: border-box;
    padding: 5px 10px;
    border-radius: 5px;
    background: #222;
    color: #fff;
    margin-top: 10px;
    width: 100%;
  }
</style>
