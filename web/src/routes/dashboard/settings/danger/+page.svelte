<script lang="ts">
  import { goto } from '$app/navigation'

  import { userStore } from '$lib/stores'
  import { alert } from '$lib/popups'
  import { req } from '$lib/utils'

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

    if (res.status === 204) {
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

    const res = await req.delete('me/tokens', {
      data: {
        id: confirmed.type === 'except' ? 'except' : 'all'
      }
    })

    if (res.status === 204) {
      await alert({
        title: 'Tokens Deleted',
        content: `All your tokens have been deleted. ${confirmed.type === 'except' ? 'Your device is still logged in.' : ''}`
      })

      if (confirmed.type !== 'except') {
        userStore.set(null)
        goto('/')
      }
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

    if (res.status === 204) {
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

  async function deleteAllPastes() {
    const confirmed = await alert({
      title: 'Delete All Pastes',
      content:
        'Are you sure you want to delete all your pastes? This action is irreversible.',
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

    const res = await req.delete('me/pastes')

    if (res.status === 204) {
      await alert({
        title: 'Pastes Deleted',
        content: 'All your pastes have been deleted.'
      })
    } else {
      await alert({
        title: 'Error',
        content: 'An error occurred while deleting your pastes.'
      })
    }
  }

  async function deleteAllCollections() {
    const confirmed = await alert({
      title: 'Delete All Collections',
      content:
        'Are you sure you want to delete all your collections? This action is irreversible.',
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

    const res = await req.delete('me/collections')

    if (res.status === 204) {
      await alert({
        title: 'Collections Deleted',
        content: 'All your collections have been deleted.'
      })
    } else {
      await alert({
        title: 'Error',
        content: 'An error occurred while deleting your collections.'
      })
    }
  }

  async function deleteAllShares() {
    const confirmed = await alert({
      title: 'Revoke All Shares',
      content:
        'Are you sure you want to revoke all your shares? This action is irreversible.',
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

    const res = await req.delete('me/shares')

    if (res.status === 204) {
      await alert({
        title: 'Shares Revoked',
        content: 'All your shares have been revoked.'
      })
    } else {
      await alert({
        title: 'Error',
        content: 'An error occurred while revoking your shares.'
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
      <button onclick={deleteAllPastes}> Delete All Pastes </button>
      <button onclick={deleteAllCollections}> Delete All Collections </button>
      <button onclick={deleteAllShares}> Revoke All Shares </button>
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
    margin-top: 10px;
    gap: 10px;
  }

  .buttons button {
    all: unset;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    background: #f00;
    transition: 200ms ease;
    outline: 1px solid transparent;
    outline-offset: 2px;
  }

  .buttons button:hover {
    opacity: 0.8;
  }

  .buttons button:focus {
    outline-color: #f00;
  }
</style>
