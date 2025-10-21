<script lang="ts">
  import { formatBytes, req } from '$lib/utils.js'
  import { onMount } from 'svelte'

  interface Props {
    info: {
      id: string
      ownerId: string
      views: number
      type: 'paste'
      paste: {
        id: string
        name: string
        content: string
        type: string
      }
    }
  }

  const { info: shareInfo }: Props = $props()
</script>

<div class="paste">
  <div class="info">
    <h2>{shareInfo.paste.name}</h2>
  </div>
  <textarea value={shareInfo.paste.content}></textarea>
</div>

<style>
  .paste {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 5px;
  }

  textarea {
    all: unset;
    background: #222;
    padding: 10px;
    border-radius: 5px;
    margin: 10px 0;
    font-size: 16px;
    font-family: monospace;
    resize: both;
    min-width: 300px;
    min-height: 100px;
  }
</style>
