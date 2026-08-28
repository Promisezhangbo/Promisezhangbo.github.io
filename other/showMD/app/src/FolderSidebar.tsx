import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'

export type DirEntry = {
  name: string
  path: string
  isDir: boolean
  isMarkdown: boolean
}

export function parentPath(path: string): string | null {
  const trimmed = path.replace(/[/\\]+$/, '')
  const i = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  if (i <= 0) return trimmed.startsWith('/') ? '/' : null
  return trimmed.slice(0, i) || '/'
}

export function dirOfFile(filePath: string): string {
  return parentPath(filePath) ?? filePath
}

export function samePath(a: string, b: string): boolean {
  return a.replace(/[/\\]+$/, '') === b.replace(/[/\\]+$/, '')
}

type Props = {
  workspaceRoot: string
  currentDir: string
  activePath: string | null
  onChangeDir: (dir: string) => void
  onOpenFile: (path: string) => void
}

export function FolderSidebar({
  workspaceRoot,
  currentDir,
  activePath,
  onChangeDir,
  onOpenFile,
}: Props) {
  const [entries, setEntries] = useState<DirEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void invoke<DirEntry[]>('list_dir', { path: currentDir })
      .then((list) => {
        if (!cancelled) {
          setEntries(list)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(String(e))
      })
    return () => {
      cancelled = true
    }
  }, [currentDir])

  const canUp = !samePath(currentDir, workspaceRoot)
  const folderName = currentDir.split(/[/\\]/).filter(Boolean).pop() ?? currentDir

  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        <button
          type="button"
          className="sidebar-up"
          disabled={!canUp}
          title="返回上一级"
          onClick={() => {
            const parent = parentPath(currentDir)
            if (parent) onChangeDir(parent)
          }}
        >
          ← 上一级
        </button>
        <span className="sidebar-folder" title={currentDir}>
          {folderName}
        </span>
      </div>
      {error ? <p className="sidebar-error">{error}</p> : null}
      <ul className="sidebar-list">
        {entries.length === 0 && !error ? (
          <li className="sidebar-empty">空文件夹</li>
        ) : null}
        {entries.map((entry) => (
          <li key={entry.path}>
            <button
              type="button"
              className={
                samePath(entry.path, activePath ?? '') ? 'sidebar-item is-active' : 'sidebar-item'
              }
              onClick={() => {
                if (entry.isDir) onChangeDir(entry.path)
                else onOpenFile(entry.path)
              }}
            >
              <span className="sidebar-kind">{entry.isDir ? '文件夹' : 'MD'}</span>
              {entry.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
