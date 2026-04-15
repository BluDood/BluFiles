import { createMessage } from '$lib/messages.js'
import { SHARE_URL } from '$lib/constants.js'
import { alert, prompt } from '$lib/popups.js'
import { req } from '$lib/utils.js'

export async function shareItem({
  shareId,
  name,
  type,
  id
}: {
  shareId: string | null
  name: string
  type: 'file' | 'folder' | 'paste' | 'collection'
  id: string
}): Promise<
  | {
      type: 'created'
      shareId: string
    }
  | {
      type: 'deleted'
    }
  | void
> {
  if (shareId) {
    const res = await req.get(`share/${shareId}`)
    if (!res || res.status !== 200) return

    const actionRes = await alert({
      title: `Sharing ${name}`,
      content: 'What would you like to do?',
      buttons: [
        {
          text: 'Copy Link',
          type: 'submit'
        },
        {
          text: `${res.data.protected ? 'Change' : 'Set'} Password`,
          type: 'pass'
        },
        {
          text: 'Delete Link',
          type: 'delete',
          color: 'red'
        },
        {
          text: 'Cancel',
          type: 'cancel'
        }
      ]
    })

    if (actionRes.type === 'submit') {
      await navigator.clipboard.writeText(`${SHARE_URL}/${shareId}`)
      createMessage({
        title: 'Link copied!',
        type: 'success',
        content: 'Shareable link copied to your clipboard'
      })
    } else if (actionRes.type === 'pass') {
      const response = await prompt({
        title: `${res.data.protected ? 'Change' : 'Set'} Password`,
        content:
          'Enter a password to protect the shareable link. Leave empty for no password.',
        placeholder: 'Password',
        buttons: [
          {
            text: res.data.protected ? 'Change Password' : 'Set Password',
            type: 'submit'
          },
          {
            text: 'Remove Password',
            type: 'remove',
            color: 'red'
          },
          {
            text: 'Cancel',
            type: 'cancel'
          }
        ]
      })

      if (
        response.type === 'remove' ||
        (response.type === 'submit' && !response.input)
      ) {
        const removeRes = await req.patch(`share/${shareId}`, {
          password: null
        })
        if (!removeRes || removeRes.status !== 204) {
          createMessage({
            type: 'error',
            title: 'An error has occurred',
            content: 'Please try again later.'
          })
          return
        }
        createMessage({
          title: 'Password removed!',
          type: 'success',
          content: 'The shareable link is no longer protected by a password.'
        })
        return
      } else if (response.type === 'submit' && response.input) {
        const patchRes = await req.patch(`share/${shareId}`, {
          password: response.input
        })
        if (!patchRes || patchRes.status !== 204) {
          createMessage({
            type: 'error',
            title: 'An error has occurred',
            content: 'Please try again later.'
          })
          return
        }
        createMessage({
          title: 'Password updated!',
          type: 'success',
          content: `The shareable link is now protected by a password.`
        })
        return
      }
    } else if (actionRes.type === 'delete') {
      const confirmed = await alert({
        title: 'Delete Link',
        content: `Are you sure you want to delete the link for "${name}"?`,
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

      const delRes = await req.delete(`share/${shareId}`)
      if (!delRes) return

      if (delRes.status !== 204) {
        createMessage({
          type: 'error',
          title: 'An error has occurred',
          content: 'Please try again later.'
        })
        return
      }

      createMessage({
        title: 'Link deleted!',
        type: 'success',
        content: 'The link has been deleted'
      })

      return {
        type: 'deleted'
      }
    }
  } else {
    const res = await alert({
      title: `Share ${name}`,
      content: `Are you sure you want to create a shareable link for this ${type}?`,
      buttons: [
        {
          text: 'Create Link',
          type: 'submit'
        },
        {
          text: 'Set Password',
          type: 'pass'
        },
        {
          text: 'Cancel',
          type: 'cancel'
        }
      ]
    })

    if (res.type === 'cancel') return
    let password: string | undefined = undefined
    if (res.type === 'pass') {
      const response = await prompt({
        title: 'Set Password',
        content:
          'Enter a password to protect the shareable link. Leave empty for no password.',
        placeholder: 'Password',
        buttons: [
          {
            text: 'Create Link',
            type: 'submit'
          },
          {
            text: 'Cancel',
            type: 'cancel'
          }
        ]
      })

      if (response.type === 'cancel') return
      if (response.input) password = response.input
    }

    const shareRes = await req.post('share', {
      type,
      id,
      password
    })

    if (!shareRes) return
    if (shareRes.status !== 200) {
      const messages: Record<number, string> = {
        403: 'You have reached your share limit.'
      }

      createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: messages[shareRes.status] || 'Please try again later.'
      })
      return
    }

    await navigator.clipboard.writeText(`${SHARE_URL}/${shareRes.data.id}`)
    createMessage({
      title: 'Link created and copied!',
      type: 'success',
      content: 'Shareable link copied to your clipboard'
    })

    return {
      type: 'created',
      shareId: shareRes.data.id
    }
  }
}
