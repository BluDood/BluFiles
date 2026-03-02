<script lang="ts">
  import { onMount } from 'svelte'

  import { formatBytes, formatDate, req } from '$lib/utils'
  import { prompt, alert, select } from '$lib/popups'
  import { createMessage } from '$lib/messages'
  import { SHARE_URL } from '$lib/constants.js'

  import CircularProgress from '$components/CircularProgress.svelte'
  import FileView from '$components/FileView.svelte'
  import Loader from '$components/Loader.svelte'

  interface FolderInfo {
    id: string
    name: string
    parentId: string | null
    files: {
      id: string
      name: string
      mime: string
      size: number
      updatedAt: string
      shareId: string | null
    }[]
    folders: {
      id: string
      name: string
      updatedAt: string
      shareId: string | null
    }[]
  }

  let loading = $state(true)
  let info: FolderInfo | null = $state(null)
  let previewing: string | false = $state(false)

  interface UploadInfo {
    name: string
    currentBytes: number
    totalBytes: number
    speed?: number
  }

  let uploadInfo: UploadInfo | null = $state(null)

  async function load(id: string | null = null) {
    loading = true

    const res = await req.get(`folder/${id || ''}`)
    if (!res) return

    info = res.data
    loading = false
  }

  async function reload() {
    load(info?.id)
  }

  async function upload() {
    const input = document.createElement('input')
    input.type = 'file'

    input.onchange = async () => {
      const files = (input as HTMLInputElement).files
      if (!files || files.length === 0) return
      const file = files[0]

      const filename = await prompt({
        title: 'Upload File',
        content: 'Please enter a name for the new file',
        placeholder: 'Enter a name...',
        defaultValue: file.name,
        buttons: [
          {
            text: 'Upload'
          },
          {
            text: 'Cancel Upload',
            color: 'red'
          }
        ]
      })

      if (!filename.type || !filename.input) return

      uploadInfo = {
        name: filename.input,
        currentBytes: 0,
        totalBytes: file.size
      }

      console.log(`File size: ${formatBytes(file.size)}`)

      const CHUNK_SIZE = 64 * 1024 * 1024

      const reader = new FileReader()

      const uploadRes = await req.post('uploads', {
        totalBytes: file.size
      })

      if (uploadRes.status !== 200) {
        const messages: Record<number, string> = {
          403: 'You have reached your file limit.'
        }

        return createMessage({
          type: 'error',
          title: 'An error has occurred',
          content: messages[uploadRes.status] || 'Please try again later.'
        })
      }

      let offset = 0
      const startTime = Date.now()
      function readNextChunk() {
        const slice = file.slice(offset, offset + CHUNK_SIZE)
        reader.readAsArrayBuffer(slice)
      }

      reader.onload = async e => {
        const content = e.target ? e.target.result : null
        if (!content) return
        const buffer = content instanceof ArrayBuffer ? content : null
        if (!buffer) return

        const res = await req.post(`uploads/${uploadRes.data.id}`, buffer, {
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        })
        if (res.status !== 200) {
          return createMessage({
            type: 'error',
            title: 'An error has occurred during upload',
            content: 'Please try again later.'
          })
        }

        const elapsedTime = (Date.now() - startTime) / 1000
        const uploadedBytes = Math.min(offset + CHUNK_SIZE, file.size)
        const speed = uploadedBytes / elapsedTime

        console.log(
          `Uploaded ${formatBytes(Math.min(offset + CHUNK_SIZE, file.size))} of ${formatBytes(file.size)} at ${formatBytes(speed)}/s`
        )

        uploadInfo!.currentBytes = uploadedBytes
        uploadInfo!.speed = speed

        offset += CHUNK_SIZE
        if (offset < file.size) {
          readNextChunk()
        } else {
          const endTime = Date.now()
          const duration = (endTime - startTime) / 1000

          const speed = file.size / duration
          console.log(
            `Upload of ${formatBytes(file.size)} completed in ${duration.toFixed(2)} seconds (${formatBytes(speed)}/s)`
          )

          uploadInfo = null

          const res = await req.post('file', {
            name: filename.input,
            folderId: info?.id || undefined,
            uploadId: uploadRes.data.id
          })
          loading = false
          if (!res) return

          if (res.status !== 200) {
            const messages: Record<number, string> = {
              403: 'You have reached your file limit.'
            }

            return createMessage({
              type: 'error',
              title: 'An error has occurred',
              content: messages[res.status] || 'Please try again later.'
            })
          }

          createMessage({
            title: 'File Uploaded',
            type: 'success',
            content: 'The file has been uploaded successfully.'
          })

          reload()
        }
      }

      reader.onerror = e => {
        console.error('Error reading file:', e)
        loading = false
        createMessage({
          type: 'error',
          title: 'An error has occurred',
          content: 'There was an error reading the file. Please try again.'
        })
      }

      loading = true
      console.log('Starting read of file...')
      readNextChunk()
    }

    input.click()
  }

  async function newFolder() {
    const name = await prompt({
      title: 'Create Folder',
      content: 'Please enter a name for the new folder',
      placeholder: 'Enter a name...',
      buttons: [
        {
          text: 'Create'
        },
        {
          text: 'Cancel'
        }
      ]
    })

    if (!name.type || !name.input) return

    const res = await req.post(`folder`, {
      name: name.input,
      parentId: info?.id
    })
    if (!res) return

    if (res.status !== 200) {
      const messages: Record<number, string> = {
        403: 'You have reached your folder limit.'
      }

      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: messages[res.status] || 'Please try again later.'
      })
    }

    createMessage({
      title: 'Folder Created',
      type: 'success',
      content: 'The folder has been created successfully.'
    })

    reload()
  }

  async function delFile(id: string, name: string) {
    const confirmed = await alert({
      title: 'Delete File',
      content: `Are you sure you want to delete the file "${name}"?`,
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

    const res = await req.delete(`file/${id}`)
    if (!res) return

    if (res.status !== 204)
      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    createMessage({
      title: 'File Deleted',
      type: 'success',
      content: 'The file has been deleted successfully.'
    })

    reload()
  }

  async function delFolder(id: string, name: string) {
    const confirmed = await alert({
      title: 'Delete Folder',
      content: `Are you sure you want to delete the folder "${name}"? This will also delete all contents recursively.`,
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

    const res = await req.delete(`folder/${id}`)
    if (!res) return

    if (res.status !== 204)
      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    createMessage({
      title: 'Folder Deleted',
      type: 'success',
      content: 'The folder has been deleted successfully.'
    })

    reload()
  }

  async function editFile(id: string, oldName: string) {
    const name = await prompt({
      title: 'Edit File',
      content: 'Please enter a new name for the file',
      defaultValue: oldName,
      buttons: [
        {
          text: 'Done'
        },
        {
          text: 'Cancel'
        }
      ]
    })

    if (!name.type || !name.input) return

    const res = await req.patch(`file/${id}`, {
      name: name.input || undefined
    })
    if (!res) return

    if (res.status !== 204)
      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    createMessage({
      title: 'File Updated',
      type: 'success',
      content: 'The file has been updated successfully.'
    })

    reload()
  }

  async function editFolder(id: string, oldName: string) {
    const name = await prompt({
      title: 'Edit Folder',
      content: 'Please enter a new name for the folder',
      defaultValue: oldName,
      buttons: [
        {
          text: 'Done'
        },
        {
          text: 'Cancel'
        }
      ]
    })

    if (!name.type || !name.input) return

    const res = await req.patch(`folder/${id}`, {
      name: name.input || undefined
    })
    if (!res) return

    if (res.status !== 204)
      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    createMessage({
      title: 'Folder Updated',
      type: 'success',
      content: 'The folder has been updated successfully.'
    })

    reload()
  }

  async function moveFile(id: string, folder: string | null) {
    const res = await req.patch(`file/${id}`, {
      folderId: folder
    })
    if (!res) return

    if (res.status !== 204)
      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    createMessage({
      type: 'success',
      title: 'File Moved',
      content: 'The file has been moved successfully.'
    })

    reload()
  }

  async function moveFolder(id: string, parent: string | null) {
    const res = await req.patch(`folder/${id}`, {
      parentId: parent
    })
    if (!res) return

    if (res.status !== 204)
      return createMessage({
        type: 'error',
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    createMessage({
      type: 'success',
      title: 'Folder Moved',
      content: 'The folder has been moved successfully.'
    })

    reload()
  }

  async function share(
    info: { id: string; name: string; shareId: string | null },
    type: 'file' | 'folder'
  ) {
    if (info.shareId) {
      const res = await alert({
        title: `Sharing ${info.name}`,
        content: 'What would you like to do?',
        buttons: [
          {
            text: 'Copy Link',
            type: 'submit'
          },
          {
            text: 'Delete Link',
            type: 'delete',
            color: 'red'
          },
          {
            text: 'Cancel'
          }
        ]
      })

      if (res.type === 'submit') {
        await navigator.clipboard.writeText(`${SHARE_URL}/${info.shareId}`)
        createMessage({
          title: 'Link copied!',
          type: 'success',
          content: 'Shareable link copied to your clipboard'
        })
      } else if (res.type === 'delete') {
        const confirmed = await alert({
          title: 'Delete Link',
          content: `Are you sure you want to delete the link for "${info.name}"?`,
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

        const delRes = await req.delete(`share/${info.shareId}`)
        if (!delRes) return

        if (delRes.status !== 204)
          return createMessage({
            type: 'error',
            title: 'An error has occurred',
            content: 'Please try again later.'
          })

        info.shareId = null
        createMessage({
          title: 'Link deleted!',
          type: 'success',
          content: 'The link has been deleted'
        })
        await reload()
      }
    } else {
      const res = await alert({
        title: `Share ${info.name}`,
        content: `Are you sure you want to create a shareable link for this ${type}?`,
        buttons: [
          {
            text: 'Create Link',
            type: 'submit'
          },
          {
            text: 'Cancel'
          }
        ]
      })

      if (res.type !== 'submit') return
      const shareRes = await req.post('share', {
        type,
        id: info.id
      })

      if (!shareRes) return
      if (shareRes.status !== 200) {
        const messages: Record<number, string> = {
          403: 'You have reached your share limit.'
        }

        return createMessage({
          type: 'error',
          title: 'An error has occurred',
          content: messages[shareRes.status] || 'Please try again later.'
        })
      }
      info.shareId = shareRes.data.id
      await navigator.clipboard.writeText(`${SHARE_URL}/${info.shareId}`)
      createMessage({
        title: 'Link created and copied!',
        type: 'success',
        content: 'Shareable link copied to your clipboard'
      })
      await reload()
    }
  }

  async function addToCollection(file: { id: string; name: string }) {
    const collections = await req.get('collection')
    if (!collections) return
    const res = await select({
      title: 'Add to Collection',
      content: `Select a collection to add "${file.name}" to:`,
      options: collections.data.map((c: { id: string; name: string }) => ({
        text: c.name,
        value: c.id
      })),
      defaultValue: collections.data[0]?.id || '',
      buttons: [
        {
          text: 'Add'
        },
        {
          text: 'Cancel'
        }
      ]
    })

    if (res.type !== true) return
    const collection = await req.get(`collection/${res.input}`)
    if (!collection) return
    const addRes = await req.patch(`collection/${collection.data.id}`, {
      fileIds: [
        ...collection.data.files.map((f: { id: string }) => f.id),
        file.id
      ]
    })
    if (!addRes) return
    if (addRes.status !== 204)
      return await alert({
        title: 'An error has occurred',
        content: 'Please try again later.'
      })

    createMessage({
      title: 'File Added to Collection',
      type: 'success',
      content: `The file has been added.`
    })
    await reload()
  }

  onMount(load)
</script>

<main data-no-padding="true">
  <div class="files">
    {#if previewing}
      <FileView
        id={previewing}
        onclose={(r: boolean) => {
          previewing = false
          if (r) reload()
        }}
      />
    {/if}
    <div class="titlebar">
      <div class="actions">
        <!-- <button>
          <span class="material-icons">arrow_back</span>
        </button>
        <button>
          <span class="material-icons">arrow_forward</span>
        </button> -->
        <button
          disabled={loading || !info?.id}
          onclick={() => load(info?.parentId)}
          ondrop={e => {
            e.preventDefault()
            if (!info) return
            if (!e.dataTransfer) return
            const id = e.dataTransfer.getData('id')
            const type = e.dataTransfer.getData('type')
            if (type === 'folder') moveFolder(id, info.parentId)
            else moveFile(id, info.parentId)
          }}
          ondragover={e => {
            e.preventDefault()
          }}
        >
          <span class="material-icons">arrow_upward</span>
        </button>
        <button disabled={loading} onclick={reload}>
          <span class="material-icons">refresh</span>
        </button>
        <div class="menuWrapper">
          <div class="menu">
            <button disabled={loading} onclick={upload}>
              <span class="material-icons">add</span>
              <p>Upload</p>
            </button>
            <button disabled={loading} onclick={newFolder}>
              <span class="material-icons">create_new_folder</span>
              <p>New Folder</p>
            </button>
          </div>
          <button disabled={loading}>
            <span class="material-icons">add</span>
          </button>
        </div>
        <button
          disabled={loading || !info?.id}
          onclick={() => load(null)}
          ondrop={e => {
            e.preventDefault()
            if (!e.dataTransfer) return
            const id = e.dataTransfer.getData('id')
            const type = e.dataTransfer.getData('type')
            if (type === 'folder') moveFolder(id, null)
            else moveFile(id, null)
          }}
          ondragover={e => {
            e.preventDefault()
          }}
        >
          <span class="material-icons">home</span>
        </button>
      </div>
      <div class="current">{info?.name || ''}</div>
    </div>
    {#if uploadInfo}
      <div class="uploading" data-uploading={!!uploadInfo}>
        <CircularProgress
          progress={(uploadInfo.currentBytes / uploadInfo.totalBytes) * 100}
        />
        <div class="info">
          <h3>
            Uploading {uploadInfo.name}...
          </h3>
          {#if uploadInfo.speed}
            <p>
              {formatBytes(uploadInfo.speed)}/s
            </p>
          {/if}
        </div>
      </div>
    {:else}
      <div class="loading" data-loading={loading}>
        <Loader />
      </div>
    {/if}
    <div class="content">
      {#if info}
        {#if info.folders.length === 0 && info.files.length === 0}
          <div class="empty">
            No files or folders here. Press + to add some!
          </div>
        {:else}
          {#each info.folders as folder (folder.id)}
            <button
              draggable="true"
              onclick={() => load(folder.id)}
              class="item"
              ondrop={e => {
                e.preventDefault()
                if (!e.dataTransfer) return
                const id = e.dataTransfer.getData('id')
                const type = e.dataTransfer.getData('type')
                if (folder.id === id) return
                if (type === 'folder') moveFolder(id, folder.id)
                else moveFile(id, folder.id)
              }}
              ondragover={e => {
                e.preventDefault()
              }}
              ondragstart={e => {
                if (!e.dataTransfer) return
                e.dataTransfer.setData('id', folder.id)
                e.dataTransfer.setData('type', 'folder')
              }}
            >
              <div class="icon">
                <span class="material-icons">folder</span>
              </div>
              <p>{folder.name}</p>
              <div class="right">
                <div class="info">
                  <span>{formatDate(folder.updatedAt)}</span>
                </div>
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div class="actions">
                  <span
                    class="action"
                    data-color={folder.shareId ? 'blue' : 'gray'}
                    tabindex="0"
                    role="button"
                    onclick={e => {
                      e.stopPropagation()
                      share(folder, 'folder')
                    }}
                  >
                    <span class="material-icons">share</span>
                  </span>
                  <span
                    class="action"
                    data-color="orange"
                    tabindex="0"
                    role="button"
                    onclick={e => {
                      e.stopPropagation()
                      editFolder(folder.id, folder.name)
                    }}
                  >
                    <span class="material-icons">edit</span>
                  </span>
                  <span
                    class="action"
                    data-color="red"
                    tabindex="0"
                    role="button"
                    onclick={e => {
                      e.stopPropagation()
                      delFolder(folder.id, folder.name)
                    }}
                  >
                    <span class="material-icons">delete</span>
                  </span>
                </div>
              </div>
            </button>
          {/each}
          {#each info.files as file (file.id)}
            <button
              draggable="true"
              class="item"
              onclick={() => (previewing = file.id)}
              ondragstart={e => {
                if (!e.dataTransfer) return
                e.dataTransfer.setData('id', file.id)
                e.dataTransfer.setData('type', 'file')
              }}
            >
              <div class="icon">
                <span class="material-icons">
                  {#if file.mime.startsWith('image')}
                    image
                  {:else if file.mime.startsWith('video')}
                    movie
                  {:else if file.mime.startsWith('audio')}
                    music_note
                  {:else if file.mime.startsWith('text')}
                    description
                  {:else}
                    insert_drive_file
                  {/if}
                </span>
              </div>
              <p>{file.name}</p>
              <div class="right">
                <div class="info">
                  <span>{formatDate(file.updatedAt)}</span>
                  <span>{formatBytes(file.size)}</span>
                </div>
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div class="actions">
                  <span
                    class="action"
                    tabindex="0"
                    role="button"
                    data-color="orange"
                    onclick={e => {
                      e.stopPropagation()
                      addToCollection(file)
                    }}
                  >
                    <span class="material-icons"> playlist_add </span>
                  </span>
                  <span
                    class="action"
                    data-color={file.shareId ? 'blue' : 'gray'}
                    tabindex="0"
                    role="button"
                    onclick={e => {
                      e.stopPropagation()
                      share(file, 'file')
                    }}
                  >
                    <span class="material-icons">share</span>
                  </span>
                  <span
                    class="action"
                    data-color="orange"
                    role="button"
                    tabindex="0"
                    onclick={e => {
                      e.stopPropagation()
                      editFile(file.id, file.name)
                    }}
                  >
                    <span class="material-icons">edit</span>
                  </span>
                  <span
                    class="action"
                    data-color="red"
                    tabindex="0"
                    role="button"
                    onclick={e => {
                      e.stopPropagation()
                      delFile(file.id, file.name)
                    }}
                  >
                    <span class="material-icons">delete</span>
                  </span>
                </div>
              </div>
            </button>
          {/each}
        {/if}
      {/if}
    </div>
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    overflow: hidden;
  }

  .files {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    animation: appear 500ms ease;
  }

  .titlebar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--background-sec);
    padding: 5px 10px;
  }

  .titlebar .actions {
    display: flex;
    gap: 2px;
  }

  .titlebar .actions button {
    all: unset;
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    transition: 200ms ease;
    border-radius: 50%;
    padding: 5px;
  }

  .titlebar .actions button:hover {
    background: var(--background-ter);
  }

  .titlebar .actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .titlebar .actions .menuWrapper {
    position: relative;
  }

  .titlebar .actions .menuWrapper .menu {
    position: absolute;
    background: var(--background-sec);
    top: 40px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    width: max-content;
    padding: 5px;
    gap: 2px;
    opacity: 0;
    pointer-events: none;
    transition: 200ms ease;
  }

  .titlebar .actions .menuWrapper:focus-within .menu {
    opacity: 1;
    pointer-events: all;
    z-index: 2;
  }

  .titlebar .actions .menuWrapper .menu button {
    all: unset;
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    transition: 200ms ease;
    padding: 5px;
    border-radius: 6px;
  }

  .titlebar .actions .menuWrapper .menu button:hover {
    background: var(--background-ter);
  }

  .current {
    display: flex;
    align-items: center;
    background: var(--background);
    flex: 1;
    padding: 0 10px;
    border-radius: 5px;
    height: 30px;
    user-select: text;
  }

  .content {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    position: relative;
    height: 100%;
  }

  .loading {
    position: absolute;
    top: 44px;
    left: 0;
    width: 100%;
    height: calc(100% - 44px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(5px);
    opacity: 0;
    pointer-events: none;
    transition: 200ms ease;
    z-index: 1;
  }

  .loading[data-loading='true'] {
    opacity: 1;
    pointer-events: all;
  }

  .uploading {
    position: absolute;
    top: 44px;
    left: 0;
    width: 100%;
    height: calc(100% - 44px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 10px;
    flex: 1;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(5px);
    opacity: 0;
    pointer-events: none;
    transition: 200ms ease;
    z-index: 10;
    animation: appear 500ms ease;
  }

  .uploading[data-uploading='true'] {
    opacity: 1;
    pointer-events: all;
  }

  .content .empty {
    display: flex;
    justify-content: center;
    color: var(--text-sec);
    margin-top: 20px;
    animation: appear 500ms ease;
  }

  .content::-webkit-scrollbar-track {
    background: var(--background-sec);
  }

  .content .item {
    all: unset;
    -webkit-user-drag: element;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 6px;
    margin: 5px;
    cursor: pointer;
    transition: 200ms ease;
    border-radius: 5px;
    animation: appear 500ms ease;
  }

  .content .item p {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .content .item:not(:has(.actions button:hover)):hover {
    background: var(--background-sec);
  }

  .content .item .icon {
    display: flex;
  }

  .content .item .right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-left: 20px;
  }

  .content .item .info {
    display: flex;
    align-items: center;
    width: max-content;
  }

  .content .item .info span {
    display: flex;
    align-items: center;
    color: var(--text-sec);
    font-size: 14px;
  }

  .content .item .info span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-sec);
    margin: 0 5px;
  }

  .content .item .actions {
    display: flex;
    gap: 10px;
    width: max-content;
  }

  .content .item .actions .action {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: 200ms ease;
  }

  .content .item .actions .action[data-color='gray'] {
    color: var(--text-ter);
  }

  .content .item .actions .action[data-color='blue'] {
    color: var(--accent);
  }

  .content .item .actions .action[data-color='red'] {
    color: var(--red);
  }

  .content .item .actions .action[data-color='orange'] {
    color: var(--orange);
  }

  .content .item .actions .action span {
    font-size: 20px;
  }
</style>
