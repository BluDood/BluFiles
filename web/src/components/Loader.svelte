<div></div>

<style>
  div:after {
    display: block;
    content: '';
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 5px solid rgba(0, 150, 255, 0.5);
    border-top-color: rgba(0, 150, 255, 1);
    animation: spin 500ms linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
