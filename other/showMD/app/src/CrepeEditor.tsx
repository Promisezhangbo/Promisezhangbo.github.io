import { Crepe } from '@milkdown/crepe'
import { editorViewCtx } from '@milkdown/kit/core'
import { TextSelection } from '@milkdown/kit/prose/state'
import { replaceAll } from '@milkdown/kit/utils'
import { useEffect, useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'

import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

export type CrepeEditorHandle = {
  getMarkdown: () => string
  setMarkdown: (markdown: string) => void
}

type Props = {
  initialMarkdown: string
  onChange: (markdown: string) => void
}

function scrollHostToTop(host: HTMLElement | null) {
  if (!host) return
  host.scrollTop = 0
  host.scrollLeft = 0
}

export function CrepeEditor({
  initialMarkdown,
  onChange,
  ref,
}: Props & { ref: Ref<CrepeEditorHandle> }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const readyRef = useRef(false)
  const skipEchoRef = useRef(0)
  const onChangeRef = useRef(onChange)
  const lastRef = useRef(initialMarkdown)
  onChangeRef.current = onChange

  useImperativeHandle(ref, () => ({
    getMarkdown: () => {
      const crepe = crepeRef.current
      if (crepe && readyRef.current) {
        try {
          lastRef.current = crepe.getMarkdown()
        } catch {
          /* editor tearing down */
        }
      }
      return lastRef.current
    },
    setMarkdown: (markdown: string) => {
      lastRef.current = markdown
      const crepe = crepeRef.current
      if (!crepe || !readyRef.current) return
      skipEchoRef.current += 1
      crepe.editor.action(replaceAll(markdown, true))
      crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        view.dispatch(view.state.tr.setSelection(TextSelection.atStart(view.state.doc)))
      })
      const host = hostRef.current
      scrollHostToTop(host)
      requestAnimationFrame(() => {
        scrollHostToTop(host)
        requestAnimationFrame(() => scrollHostToTop(host))
      })
    },
  }))

  useEffect(() => {
    const root = hostRef.current
    if (!root) return

    const crepe = new Crepe({
      root,
      defaultValue: initialMarkdown,
      features: {
        [Crepe.Feature.AI]: false,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: '开始写作…',
          mode: 'block',
        },
      },
    })

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        lastRef.current = markdown
        if (skipEchoRef.current > 0) {
          skipEchoRef.current -= 1
          return
        }
        onChangeRef.current(markdown)
      })
    })

    crepeRef.current = crepe
    void crepe.create().then(() => {
      readyRef.current = true
    })

    return () => {
      readyRef.current = false
      crepeRef.current = null
      void crepe.destroy()
    }
    // Mount once; file loads go through setMarkdown.
  }, [])

  return <div className="editor-host" ref={hostRef} />
}
