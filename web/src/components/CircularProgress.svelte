<script lang="ts">
  interface Props {
    progress: number
  }

  const { progress }: Props = $props()
</script>

<main>
  <svg
    width="50"
    height="50"
    viewBox="0 0 50 50"
    style="--progress: {100 - progress}"
  >
    <circle class="bg" cx="25" cy="25" r="22.5" />
    <circle class="progress" cx="25" cy="25" r="22.5" pathLength="100" />
  </svg>
  <div class="label">
    {Math.round(progress)}%
  </div>
</main>

<style>
  main {
    position: relative;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .label {
    position: absolute;
    font-size: 14px;
    font-weight: 500;
  }

  circle {
    fill: none;
    stroke-width: 5;
    animation: opacity 500ms ease;
  }

  .bg {
    stroke: rgba(0, 0, 0, 0.5);
  }

  .progress {
    stroke: var(--accent);
    stroke-dasharray: 100;
    stroke-dashoffset: var(--progress);
    stroke-linecap: round;
    transform: rotate(-90deg);
    transform-origin: center;
    transition: stroke-dashoffset 200ms ease;
  }
</style>
