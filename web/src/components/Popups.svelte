<script lang="ts">
  import { popups, closeAll } from '$lib/popups'

  import Popup from './Popup.svelte'
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="popups"
  data-active={$popups.filter(p => !p.closing).length !== 0}
  onclick={e => {
    if (e.target === e.currentTarget) closeAll()
  }}
>
  {#each $popups as popup (popup.id)}
    <Popup {popup} />
  {/each}
</div>

<style>
  .popups {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 200ms ease;
    z-index: 10;
  }

  .popups[data-active='true'] {
    opacity: 1;
    pointer-events: all;
  }
</style>
