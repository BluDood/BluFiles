<script lang="ts">
  import { alert, prompt, select } from '$lib/popups'
  import { createMessage } from '$lib/messages.js'

  let type = $state('')
  let input = $state('')

  async function showAlert() {
    const res = await alert({
      title: 'Alert',
      content: 'This is a test',
      buttons: [
        {
          text: 'Submit',
          type: 'submit'
        },
        {
          text: 'Delete',
          type: 'delete',
          color: 'red'
        },
        {
          text: 'Cancel',
          type: 'cancel'
        }
      ]
    })

    console.log(res)
    type = res.type
    input = '(empty)'
  }

  async function showPrompt() {
    const res = await prompt({
      title: 'Prompt',
      content: 'This is a test',
      placeholder: 'This is a placeholder',
      defaultValue: 'This is a default value',
      buttons: [
        {
          text: 'Submit',
          type: 'submit'
        },
        {
          text: 'Delete',
          type: 'delete',
          color: 'red'
        },

        {
          text: 'Cancel',
          type: 'cancel'
        }
      ]
    })

    console.log(res)
    type = res.type
    input = res.input || '(empty)'
  }

  async function showSelect() {
    const res = await select({
      title: 'Select',
      content: 'This is a test',
      options: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2' },
        { text: 'Option 3', value: 'option3' }
      ],
      placeholder: 'This is a placeholder',
      defaultValue: 'option2',
      buttons: [
        {
          text: 'Submit',
          type: 'submit'
        },
        {
          text: 'Delete',
          type: 'delete',
          color: 'red'
        },
        {
          text: 'Cancel',
          type: 'cancel'
        }
      ]
    })

    console.log(res)
    type = res.type
    input = res.input || '(empty)'
  }

  let msgI = 0

  async function showMessage() {
    const types = ['info', 'success', 'warning', 'error']
    const type = types[msgI % types.length]
    msgI++
    const res = await createMessage({
      title: 'Message',
      type: type as 'info' | 'success' | 'warning' | 'error'
    })

    console.log(res)
  }
</script>

<div class="buttons">
  <button onclick={showAlert}>Show Alert</button>
  <button onclick={showPrompt}>Show Prompt</button>
  <button onclick={showSelect}>Show Select</button>
  <button onclick={showMessage}>Show Message</button>
</div>

{#if type !== ''}
  <p class="result">Last result: {type} {input}</p>
{/if}

<style>
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .buttons button {
    all: unset;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--background-ter);
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
  }

  .buttons button:hover {
    opacity: 0.8;
  }

  .buttons button:focus {
    outline-color: var(--outline);
  }

  .result {
    margin-top: 20px;
  }
</style>
