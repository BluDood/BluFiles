<script lang="ts">
  import { onDestroy, onMount } from 'svelte'

  import type * as Monaco from 'monaco-editor'
  import loader from '@monaco-editor/loader'

  import { resolveLanguage } from '$lib/utils.js'

  import Loader from './Loader.svelte'

  let editor: Monaco.editor.IStandaloneCodeEditor
  let monaco: typeof Monaco
  let editorContainer: HTMLElement
  let loading = $state(false)

  interface Props {
    value: string
    language?: string
    readonly?: boolean
  }

  let {
    value = $bindable(),
    language = $bindable(),
    readonly = $bindable(false),
    ...restProps
  }: Props = $props()

  onMount(async () => {
    const timeout = setTimeout(() => {
      loading = true
    }, 10)

    const monacoEditor = await import('monaco-editor')
    loader.config({ monaco: monacoEditor.default })

    monaco = await loader.init()

    clearTimeout(timeout)

    loading = false

    monaco.editor.defineTheme('default', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        {
          token: 'identifier',
          foreground: '9CDCFE'
        }
      ],
      colors: {}
    })

    const resolved = resolveLanguage(language)

    editor = monaco.editor.create(editorContainer, {
      value,
      language: resolved?.monaco || 'plaintext',
      theme: 'default',
      automaticLayout: true,
      wordWrap: 'on',
      readOnly: readonly,
      minimap: {
        enabled: false
      },
      allowOverflow: false,
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      suggest: {
        showWords: false
      },
      padding: {
        top: 10,
        bottom: 10
      },
      lineNumbers: resolved?.noLineNumbers ? 'off' : 'on'
    })

    if (!readonly) editor.focus()

    editor.onDidChangeModelContent(e => {
      if (e.isFlush) return
      value = editor!.getValue()
    })
  })

  $effect(() => {
    void value
    if (editor && value) {
      if (!editor.hasWidgetFocus()) {
        if (editor.getValue() !== value) editor.setValue(value)
      }
    }
  })

  $effect(() => {
    void readonly
    if (editor) {
      editor.updateOptions({
        readOnly: readonly
      })
    }
  })

  $effect(() => {
    void language
    if (editor && language) {
      const resolved = resolveLanguage(language)
      monaco?.editor.setModelLanguage(
        editor.getModel()!,
        resolved?.monaco || 'plaintext'
      )
      editor.updateOptions({
        lineNumbers: resolved?.noLineNumbers ? 'off' : 'on'
      })
    }
  })

  onDestroy(() => {
    monaco?.editor.getModels().forEach(model => model.dispose())
    editor?.dispose()
  })
</script>

<main data-loading={loading}>
  <div class="monaco" bind:this={editorContainer} {...restProps}></div>
  <div class="load">
    <Loader />
  </div>
</main>

<style>
  main {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .monaco {
    width: 100%;
    height: 100%;
    transition: 500ms ease;
  }

  main[data-loading='true'] .monaco {
    filter: blur(4px);
  }

  .load {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    background: #000;
    z-index: 1;
    pointer-events: none;
    transition: 500ms ease;
  }

  main[data-loading='true'] .load {
    opacity: 1;
    pointer-events: all;
  }
</style>
