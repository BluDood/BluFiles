<script lang="ts">
  import { page } from '$app/state'

  const items = [
    {
      name: 'Dashboard',
      icon: 'home',
      path: '/dashboard'
    },
    {
      name: 'Files',
      icon: 'folder',
      path: '/dashboard/files'
    },
    {
      name: 'Pastes',
      icon: 'content_paste',
      path: '/dashboard/pastes'
    },
    {
      name: 'Collections',
      icon: 'collections',
      path: '/dashboard/collections'
    },
    {
      name: 'Sharing',
      icon: 'share',
      path: '/dashboard/sharing'
    },
    {
      name: 'Tokens',
      icon: 'key',
      path: '/dashboard/tokens'
    },
    {
      name: 'Usage',
      icon: 'bar_chart',
      path: '/dashboard/usage'
    },
    {
      name: 'Profile',
      icon: 'person',
      path: '/dashboard/profile'
    },
    {
      name: 'Settings',
      icon: 'settings',
      path: '/dashboard/settings'
    },
    {
      name: 'Debug',
      icon: 'bug_report',
      path: '/dashboard/debug'
    }
  ]
</script>

<div class="sidebar">
  <!-- <button class="item"> <span class="material-icons">menu</span></button> -->
  {#each items as item}
    <a
      href={item.path}
      class="item"
      data-active={page.url.pathname === item.path}
    >
      <span class="material-icons">{item.icon}</span>
      <span class="popup">{item.name}</span>
    </a>
  {/each}
</div>

<style>
  .sidebar {
    width: 50px;
    height: 100%;
    background: #111;
    display: flex;
    flex-direction: column;
    padding: 5px;
    gap: 5px;
  }

  .item {
    all: unset;
    display: flex;
    justify-content: center;
    align-items: center;
    aspect-ratio: 1/1;
    border-radius: 5px;
    cursor: pointer;
    transition: 200ms ease;
    position: relative;
  }

  .item:is([data-active='true'], :hover, :focus-visible) {
    background: #252525;
  }

  .item .popup {
    position: absolute;
    top: 8px;
    left: calc(100% + 20px);
    background: #252525;
    padding: 3px 5px;
    border-radius: 5px;
    opacity: 0;
    z-index: 999;
    pointer-events: none;
    font-size: 14px;
    font-weight: 600;
    transition: 200ms ease;
  }

  .item:is(:hover, :focus-visible) .popup {
    opacity: 1;
    transform: translateX(-10px);
  }
</style>
