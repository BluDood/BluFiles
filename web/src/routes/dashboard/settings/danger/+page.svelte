<script lang="ts">
  import { alert } from '$lib/popups'
  import { req } from '$lib/utils'
  import { userStore } from '$lib/stores'

  async function deleteAccount() {
    const confirmed = await alert({
      title: 'Delete Account',
      content:
        'Are you sure you want to delete your account? This will also delete all your files and folders. This action is irreversible.',
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

    const res = await req.delete('me')

    if (res.status === 200) {
      await alert({
        title: 'Account Deleted',
        content: 'Your account has been deleted. You will be redirected.'
      })

      userStore.set(null)
      window.location.href = '/'
    } else {
      await alert({
        title: 'Error',
        content: 'An error occurred while deleting your account.'
      })
    }
  }

  async function deleteAllTokens() {
    const confirmed = await alert({
      title: 'Delete All Tokens',
      content:
        'Are you sure you want to revoke all account tokens? This action is irreversible.',
      buttons: [
        {
          text: 'Revoke All',
          color: 'red'
        },
        {
          text: 'Revoke All Except Current',
          color: 'red',
          type: 'except'
        },
        {
          text: 'Cancel'
        }
      ]
    })

    if (!confirmed.type) return

    const res = await req.delete('me/tokens')

    if (res.status === 200) {
      await alert({
        title: 'Tokens Deleted',
        content: 'All your tokens have been deleted.'
      })
    } else {
      await alert({
        title: 'Error',
        content: 'An error occurred while deleting your tokens.'
      })
    }
  }

  async function deleteAllFiles() {
    const confirmed = await alert({
      title: 'Delete All Files and Folders',
      content:
        'Are you sure you want to delete all your files and folders? This action is irreversible.',
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

    const res = await req.delete('me/files')

    if (res.status === 200) {
      await alert({
        title: 'Files and Folders Deleted',
        content: 'All your files and folders have been deleted.'
      })
    } else {
      await alert({
        title: 'Error',
        content: 'An error occurred while deleting your files and folders.'
      })
    }
  }
</script>

<main>
  <div class="section">
    <h2>Danger Zone</h2>
    <div class="buttons">
      <button onclick={deleteAccount}>Delete Account</button>
      <button onclick={deleteAllTokens}>Revoke All Tokens</button>
      <button onclick={deleteAllFiles}> Delete All Files and Folders </button>
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
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
  }

  .buttons button {
    all: unset;
    display: flex;
    justify-content: center;
    padding: 10px 20px;
    text-align: center;
    border-radius: 5px;
    background: red;
    font-size: 16px;
    transition: 200ms ease;
    cursor: pointer;
  }
</style>
