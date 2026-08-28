import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open, save } from '@tauri-apps/plugin-dialog'
import { useCallback, useEffect, useRef, useState } from 'react'

import { CrepeEditor } from './CrepeEditor'
import type { CrepeEditorHandle } from './CrepeEditor'
import { FolderSidebar, dirOfFile } from './FolderSidebar'
import { WELCOME_MARKDOWN } from './welcome'
import './App.css'

const MD_FILTERS = [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]

function fileName(path: string | null): string {
  if (!path) return '未命名'
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1] || path
}

export default function App() {
  const editorRef = useRef<CrepeEditorHandle>(null)
  const pathRef = useRef<string | null>(null)
  const dirtyRef = useRef(false)
  const savedRef = useRef(WELCOME_MARKDOWN)

  const [path, setPath] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null)
  const [currentDir, setCurrentDir] = useState<string | null>(null)

  const syncTitle = useCallback(async (nextPath: string | null, nextDirty: boolean) => {
    const mark = nextDirty ? ' ●' : ''
    await getCurrentWindow().setTitle(`${fileName(nextPath)}${mark} — showMD`)
  }, [])

  const markDirty = useCallback(
    (markdown: string) => {
      const next = markdown !== savedRef.current
      dirtyRef.current = next
      setDirty(next)
      void syncTitle(pathRef.current, next)
    },
    [syncTitle],
  )

  const confirmDiscard = useCallback(() => {
    if (!dirtyRef.current) return true
    return window.confirm('有未保存的修改，确定丢弃？')
  }, [])

  const loadFile = useCallback(
    async (filePath: string) => {
      const text = await invoke<string>('read_markdown', { path: filePath })
      pathRef.current = filePath
      savedRef.current = text
      dirtyRef.current = false
      setPath(filePath)
      setDirty(false)
      editorRef.current?.setMarkdown(text)
      void syncTitle(filePath, false)
      const folder = dirOfFile(filePath)
      setCurrentDir((prev) => prev ?? folder)
      setWorkspaceRoot((prev) => prev ?? folder)
    },
    [syncTitle],
  )

  const doNew = useCallback(() => {
    if (!confirmDiscard()) return
    pathRef.current = null
    savedRef.current = WELCOME_MARKDOWN
    dirtyRef.current = false
    setPath(null)
    setDirty(false)
    editorRef.current?.setMarkdown(WELCOME_MARKDOWN)
    void syncTitle(null, false)
  }, [confirmDiscard, syncTitle])

  const doOpen = useCallback(async () => {
    if (!confirmDiscard()) return
    const selected = await open({ multiple: false, filters: MD_FILTERS })
    if (selected === null || Array.isArray(selected)) return
    await loadFile(selected)
  }, [confirmDiscard, loadFile])

  const doOpenFolder = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false })
    if (selected === null || Array.isArray(selected)) return
    setWorkspaceRoot(selected)
    setCurrentDir(selected)
  }, [])

  const persist = useCallback(
    async (target: string) => {
      const contents = editorRef.current?.getMarkdown() ?? ''
      await invoke('write_markdown', { path: target, contents })
      pathRef.current = target
      savedRef.current = contents
      dirtyRef.current = false
      setPath(target)
      setDirty(false)
      void syncTitle(target, false)
      const folder = dirOfFile(target)
      setCurrentDir((prev) => prev ?? folder)
      setWorkspaceRoot((prev) => prev ?? folder)
    },
    [syncTitle],
  )

  const doSave = useCallback(async () => {
    const current = pathRef.current
    if (current) {
      await persist(current)
      return
    }
    const target = await save({ filters: MD_FILTERS, defaultPath: 'untitled.md' })
    if (!target) return
    await persist(target)
  }, [persist])

  const doSaveAs = useCallback(async () => {
    const target = await save({
      filters: MD_FILTERS,
      defaultPath: fileName(pathRef.current) === '未命名' ? 'untitled.md' : fileName(pathRef.current),
    })
    if (!target) return
    await persist(target)
  }, [persist])

  const openFromSidebar = useCallback(
    (filePath: string) => {
      if (!confirmDiscard()) return
      void loadFile(filePath)
    },
    [confirmDiscard, loadFile],
  )

  const handlersRef = useRef({ doNew, doOpen, doOpenFolder, doSave, doSaveAs })
  handlersRef.current = { doNew, doOpen, doOpenFolder, doSave, doSaveAs }

  useEffect(() => {
    void syncTitle(null, false)
    const unlisten = Promise.all([
      listen('new', () => handlersRef.current.doNew()),
      listen('open', () => void handlersRef.current.doOpen()),
      listen('open_folder', () => void handlersRef.current.doOpenFolder()),
      listen('save', () => void handlersRef.current.doSave()),
      listen('save_as', () => void handlersRef.current.doSaveAs()),
    ])
    return () => {
      void unlisten.then((fns) => fns.forEach((fn) => fn()))
    }
  }, [syncTitle])

  return (
    <div className="shell">
      <header className="chrome">
        <span className="doc-name" title={path ?? ''}>
          {fileName(path)}
          {dirty ? ' ●' : ''}
        </span>
        <div className="actions">
          <button type="button" onClick={doNew}>
            新建
          </button>
          <button type="button" onClick={() => void doOpen()}>
            打开
          </button>
          <button type="button" onClick={() => void doOpenFolder()}>
            打开文件夹
          </button>
          <button type="button" onClick={() => void doSave()}>
            保存
          </button>
        </div>
      </header>
      <div className="workspace">
        {workspaceRoot && currentDir ? (
          <FolderSidebar
            workspaceRoot={workspaceRoot}
            currentDir={currentDir}
            activePath={path}
            onChangeDir={setCurrentDir}
            onOpenFile={openFromSidebar}
          />
        ) : (
          <aside className="sidebar sidebar-idle">
            <p>点「打开文件夹」，用访达选一个目录。点进子文件夹后可用「上一级」返回。</p>
          </aside>
        )}
        <CrepeEditor ref={editorRef} initialMarkdown={WELCOME_MARKDOWN} onChange={markDirty} />
      </div>
    </div>
  )
}
