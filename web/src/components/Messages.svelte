<script lang="ts">
  import { messages } from '$lib/messages'
</script>

<div class="messages">
  {#each $messages as message (message.id)}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="message"
      data-type={message.type}
      data-dismissable={message.dismissable}
      data-closing={message.closing}
      onclick={() => message.dismissable && message.dismiss()}
    >
      <span class="icon material-icons">
        {#if message.type === 'success'}
          check_circle
        {:else if message.type === 'info'}
          info
        {:else if message.type === 'warning'}
          warning
        {:else if message.type === 'error'}
          error
        {/if}
      </span>
      <div class="content">
        <div class="title">{message.title}</div>
        <div class="text">{message.content}</div>
      </div>
      <span class="close material-icons">close</span>
    </div>
  {/each}
</div>

<style>
  .messages {
    position: fixed;
    bottom: 0;
    right: 0;
    pointer-events: none;
    display: flex;
    flex-direction: column-reverse;
    gap: 10px;
    z-index: 15;
    height: 100vh;
    z-index: 1000;
    overflow: hidden;
    overflow-y: auto;
    scrollbar-width: none;
    padding: 10px;
  }

  .messages::-webkit-scrollbar {
    display: none;
  }

  .message {
    animation: slideIn 500ms ease;
    pointer-events: all;
    background: var(--background-sec);
    width: 350px;
    max-width: calc(100vw - 20px);
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 8px;
    gap: 10px;
    transition: 500ms ease;
    transition-property: transform, padding, height;
    height: 44px;
  }

  .message[data-dismissable='true'] {
    cursor: pointer;
  }

  .message[data-closing='true'] {
    transform: translateX(110%) scale(0);
    height: 0;
    padding: 0;
  }

  .message[data-type='info'] {
    background: var(--accent);
  }

  .message[data-type='success'] {
    background: var(--success);
  }

  .message[data-type='warning'] {
    background: var(--warning);
  }

  .message[data-type='error'] {
    background: var(--error);
  }

  .content {
    flex: 1;
  }

  .message .title {
    font-weight: bold;
    font-size: 16px;
  }

  .message .text {
    font-size: 14px;
  }

  .close {
    height: 100%;
    font-size: 18px;
    opacity: 0;
  }

  .message[data-dismissable='true'] .close {
    opacity: 1;
  }

  @keyframes slideIn {
    from {
      transform: translateX(110%);
    }
    to {
      transform: translateX(0);
    }
  }
</style>
