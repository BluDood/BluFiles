<script lang="ts">
  interface Props {
    value: boolean
    onchange?: (value: boolean) => void
  }

  let { value, onchange }: Props = $props()
</script>

<label class="switch">
  <input
    type="checkbox"
    bind:checked={value}
    onchange={onchange ? () => onchange(value) : undefined}
  />
  <span class="slider"></span>
</label>

<style>
  .switch {
    --width: 48px;
    --height: 24px;
    --slider-padding: 4px;
    --unchecked: var(--foreground);
    --checked: var(--accent);

    position: relative;
    display: inline-block;
    min-width: var(--width);
    height: var(--height);
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .switch .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--unchecked);
    transition: 200ms ease;
    border-radius: 9999px;
    outline: 1px solid transparent;
    outline-offset: 2px;
  }

  .switch .slider:before {
    position: absolute;
    content: '';
    height: calc(var(--height) - var(--slider-padding) * 2);
    width: calc(var(--height) - var(--slider-padding) * 2);
    left: var(--slider-padding);
    bottom: var(--slider-padding);
    background-color: white;
    transition: 200ms ease;
    border-radius: 50%;
  }

  .switch input:checked + .slider {
    background-color: var(--checked);
  }

  .switch input:checked + .slider:before {
    transform: translateX(calc(var(--width) - var(--height)));
  }

  .switch input:focus-visible + .slider {
    outline-color: var(--checked);
  }
</style>
