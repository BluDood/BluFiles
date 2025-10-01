<script>
  import { alert, prompt } from '$lib/popups'

  async function showAlert() {
    const res = await alert({
      title: 'Alert',
      content: 'This is a test',
      buttons: [
        {
          text: 'Submit',
          type: 'submit',
          color: 'blue'
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
          type: 'submit',
          color: 'blue'
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
  }
</script>

<button on:click={showAlert}>Show Alert</button>
<button on:click={showPrompt}>Show Prompt</button>
