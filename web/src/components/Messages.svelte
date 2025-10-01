<script>
  import { messages } from '$lib/messages'
</script>

<div class="messages">
  {#each $messages as message}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="message"
      data-type={message.type}
      data-dismissable={message.dismissable}
      data-closing={message.closing}
      on:click={() => message.dismissable && message.dismiss()}
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
    margin: 10px;
    gap: 10px;
    z-index: 15;
  }

  .message {
    animation: slideIn 500ms ease;
    pointer-events: all;
    background: #111;
    width: 300px;
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 8px;
    gap: 10px;
    transition: transform 500ms ease;
  }

  .message[data-dismissable='true'] {
    cursor: pointer;
  }

  .message[data-closing='true'] {
    transform: translateX(110%);
  }

  .message[data-type='success'] {
    background: rgb(0, 200, 0);
  }

  .message[data-type='info'] {
    background: rgb(0, 50, 255);
  }

  .message[data-type='warning'] {
    background: rgb(255, 100, 0);
  }

  .message[data-type='error'] {
    background: rgb(255, 0, 0);
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
