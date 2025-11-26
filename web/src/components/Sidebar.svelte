<script lang="ts">
  import { page } from '$app/state'

  import { userStore } from '$lib/stores.js'

  const items = [
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
    },
    {
      name: 'Admin',
      icon: 'admin_panel_settings',
      path: '/dashboard/admin',
      admin: true
    }
  ]
</script>

<div class="sidebar">
  <a
    href="/dashboard"
    class="item"
    data-active={page.url.pathname === '/dashboard'}
  >
    <span class="material-icons">home</span>
    <span class="popup">Dashboard</span>
  </a>
  {#each items as item}
    {#if !(item.admin && $userStore?.type !== 'admin')}
      <a
        href={item.path}
        class="item"
        data-active={page.url.pathname.startsWith(item.path)}
      >
        <span class="material-icons">{item.icon}</span>
        <span class="popup">{item.name}</span>
      </a>
    {/if}
  {/each}
</div>

<style>
  .sidebar {
    width: 50px;
    height: 100%;
    background: var(--background-sec);
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
    background: var(--hover-sec);
  }

  .item .popup {
    position: absolute;
    top: 8px;
    left: calc(100% + 20px);
    background: var(--hover-sec);
    padding: 3px 5px;
    border-radius: 5px;
    opacity: 0;
    z-index: 1;
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
