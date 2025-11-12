<script lang="ts">
  import { formatBytes, formatDate, req } from '$lib/utils.js'
  import { onMount } from 'svelte'

  interface Props {
    info: {
      id: string
      ownerId: string
      views: number
      type: 'paste'
      createdAt: string
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
  <div class="shareInfo">
    <h2>{shareInfo.paste.name}</h2>
    <div class="details">
      <span>Paste</span>
      <span>{shareInfo.paste.type}</span>
      <span>{shareInfo.views} view{shareInfo.views === 1 ? '' : 's'}</span>
      <span>{formatDate(shareInfo.createdAt)}</span>
    </div>
  </div>
  <textarea value={shareInfo.paste.content} disabled></textarea>
</div>

<style>
  .paste {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    height: 100%;
    animation: appear 500ms ease;
  }

  .shareInfo {
    background: #111;
    border-radius: 10px;
    padding: 20px;
    width: 100%;
  }

  .shareInfo h2 {
    font-weight: 600;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
    flex: 1;
  }

  .shareInfo .details {
    display: flex;
    align-items: center;
  }

  .shareInfo .details span {
    display: flex;
    align-items: center;
    color: #aaa;
    font-size: 16px;
  }

  .shareInfo .details span:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #aaa;
    margin: 0 5px;
  }

  textarea {
    all: unset;
    background: #222;
    padding: 10px;
    border-radius: 5px;
    font-size: 16px;
    font-family: monospace;
    resize: vertical;
    width: calc(100% - 20px);
    height: 300px;
  }
</style>
