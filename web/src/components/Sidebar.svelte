<script lang="ts">
  import { page } from '$app/state'

  import { userStore } from '$lib/stores.js'
  import { isDev } from '$lib/utils.js'

  interface SidebarItem {
    name: string
    icon: string
    path: string
    exact?: boolean
    admin?: boolean
    dev?: boolean
  }

  const items: SidebarItem[] = [
    {
      name: 'Dashboard',
      icon: 'home',
      path: '/dashboard/',
      exact: true
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
      path: '/dashboard/debug',
      dev: true
    },
    {
      name: 'Admin',
      icon: 'admin_panel_settings',
      path: '/dashboard/admin',
      admin: true
    }
  ]

  const isItemShown = (item: SidebarItem) => {
    if (item.admin && $userStore?.type !== 'admin') return false
    if (item.dev && !isDev) return false

    return true
  }

  const isItemHighlighted = (item: SidebarItem) => {
    if (item.exact) return page.url.pathname === item.path
    return page.url.pathname.startsWith(item.path)
  }
</script>

<div class="sidebar">
  {#each items as item}
    {#if isItemShown(item)}
      <a href={item.path} class="item" data-active={isItemHighlighted(item)}>
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
