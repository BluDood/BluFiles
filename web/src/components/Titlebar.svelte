<script lang="ts">
  import { req } from '$lib/utils'
  import { userStore } from '$lib/stores'
  import { alert } from '$lib/popups'

  async function logout() {
    const res = await req.post('/me/logout')

    if (res.status !== 204)
      return await alert({
        title: 'Logout',
        content: 'An error has occurred while logging you out.',
        buttons: [
          {
            text: 'Dismiss'
          }
        ]
      })

    localStorage.removeItem('token')
    window.location.href = '/'
  }
</script>

<div class="titlebar">
  <a href="/" class="title">
    <img src="/assets/BluFilesSquare.png" alt="" />
    <div class="text">BluFiles</div>
  </a>
  <div class="actions">
    <div class="menu">
      <button class="opener">
        <span class="material-icons">person</span>
      </button>
      <div class="content">
        <a href="/dashboard/profile" class="item user">
          <span class="material-icons">person</span>
          <div>
            <span class="name">{$userStore?.username}</span>
            <span class="id">{$userStore?.id}</span>
          </div>
        </a>
        <button data-color="red" on:click={logout} class="item">
          <span class="material-icons">logout</span>
          Logout
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .titlebar {
    height: 50px;
    width: 100%;
    background: #111;
    display: flex;
    justify-content: space-between;
    padding: 0 10px;
  }

  .title {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: 200ms ease;
  }

  .title:hover,
  .title:focus {
    color: #bbb;
  }

  .title img {
    height: 30px;
    width: 30px;
  }

  .title .text {
    font-size: 22px;
    font-weight: bold;
  }

  .actions {
    display: flex;
    align-items: center;
  }

  .actions .menu {
    position: relative;
    z-index: 999;
  }

  .actions .menu .opener {
    all: unset;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    transition: 200ms ease;
  }

  .actions .menu .opener:hover {
    background: #222;
  }

  .actions .menu .content {
    position: absolute;
    top: 100%;
    right: 0;
    background: #111;
    border-radius: 10px;
    padding: 5px;
    opacity: 0;
    pointer-events: none;
    transition: 200ms ease;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .actions .menu .content .item {
    all: unset;
    padding: 5px 10px;
    cursor: pointer;
    transition: 200ms ease;
    border-radius: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  .actions .menu .content .item[data-color='red'] {
    color: red;
  }

  .actions .menu .content .item:hover {
    background: #222;
  }

  .actions .menu:focus-within .content {
    opacity: 1;
    pointer-events: all;
    transform: translateY(20px);
  }

  .actions .menu .content .user > div {
    display: flex;
    flex-direction: column;
  }

  .actions .menu .content .user > div .id {
    font-size: 14px;
    color: #aaa;
  }
</style>
