<script lang="ts">
  interface Props {
    value: number
    max: number
  }

  let { value, max }: Props = $props()

  let percentage = $derived(Math.min(Math.max(value / max, 0), 1) * 100)
</script>

<div class="progress">
  <div class="bar" style="width: {percentage}%;"></div>
</div>

<style>
  .progress {
    width: 100%;
    height: 8px;
    background: #333;
    border-radius: 9999px;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    background: #0064ff;
    transition: width 300ms ease;
    border-radius: 9999px;
  }
</style>
