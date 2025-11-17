<script>
  import { onMount } from 'svelte'

  import { goto } from '$app/navigation'

  onMount(() => {
    goto('/dashboard/settings/password')
  })
</script>
