<script lang="ts">
  interface Props {
    progress: number
    showLabel?: boolean
    size?: number
  }

  const { progress, showLabel = true, size = 50 }: Props = $props()
</script>

<div class="progress" style="--size: {size}">
  <svg
    width="50"
    height="50"
    viewBox="0 0 50 50"
    style="--progress: {100 - progress}"
  >
    <circle class="bg" cx="25" cy="25" r="22.5" />
    <circle class="bar" cx="25" cy="25" r="22.5" pathLength="100" />
  </svg>
  {#if showLabel}
    <div class="label">
      {Math.round(progress)}%
    </div>
  {/if}
</div>

<style>
  .progress {
    position: relative;
    width: calc(var(--size) * 1px);
    height: calc(var(--size) * 1px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .label {
    position: absolute;
    font-size: calc(var(--size) * 0.3px);
    font-weight: 500;
  }

  svg {
    width: 100%;
    height: 100%;
  }

  circle {
    fill: none;
    stroke-width: 5;
    animation: opacity 500ms ease;
  }

  .bg {
    stroke: rgba(0, 0, 0, 0.5);
  }

  .bar {
    stroke: var(--accent);
    stroke-dasharray: 100;
    stroke-dashoffset: var(--progress);
    stroke-linecap: round;
    transform: rotate(-90deg);
    transform-origin: center;
    transition: stroke-dashoffset 200ms ease;
  }
</style>
