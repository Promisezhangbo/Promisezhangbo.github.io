import Cocoa
import Foundation
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: NSWindow?
    var webView: WKWebView?
    var server: Process?

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()
        let rect = NSRect(x: 0, y: 0, width: 1040, height: 760)
        let win = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        win.title = "电脑自检"
        win.minSize = NSSize(width: 800, height: 560)
        win.center()
        win.setFrameAutosaveName("SelfCheckWindow")
        window = win

        do {
            let url = try startServer()
            let web = WKWebView(frame: win.contentView?.bounds ?? rect)
            web.autoresizingMask = [.width, .height]
            web.navigationDelegate = self
            win.contentView = web
            webView = web
            web.load(URLRequest(url: url))
            win.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        } catch {
            let alert = NSAlert()
            alert.messageText = "电脑自检无法启动"
            alert.informativeText = error.localizedDescription
                + "\n\n请确认已安装 Python 3.9+（Homebrew 或 python.org）。"
            alert.alertStyle = .critical
            alert.runModal()
            NSApp.terminate(nil)
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        server?.terminate()
        server = nil
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }

    private func resourcePath() -> String {
        Bundle.main.resourcePath ?? "."
    }

    private func pythonPath() -> String {
        let file = (resourcePath() as NSString).appendingPathComponent("python_path.txt")
        if let text = try? String(contentsOfFile: file, encoding: .utf8) {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty, FileManager.default.isExecutableFile(atPath: trimmed) {
                return trimmed
            }
        }
        for candidate in ["/usr/local/bin/python3", "/opt/homebrew/bin/python3", "/usr/bin/python3"] {
            if FileManager.default.isExecutableFile(atPath: candidate) {
                return candidate
            }
        }
        return "/usr/bin/python3"
    }

    private func startServer() throws -> URL {
        let resources = resourcePath()
        let script = (resources as NSString).appendingPathComponent("server.py")
        guard FileManager.default.fileExists(atPath: script) else {
            throw NSError(
                domain: "SelfCheck",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "找不到 server.py，应用资源不完整。"]
            )
        }

        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: pythonPath())
        proc.arguments = [script, "--port", "17831"]
        proc.currentDirectoryURL = URL(fileURLWithPath: resources)
        var env = ProcessInfo.processInfo.environment
        env["SELFCHECK_APP"] = "1"
        env["PYTHONUNBUFFERED"] = "1"
        env["PATH"] = "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        proc.environment = env

        let pipe = Pipe()
        proc.standardOutput = pipe
        proc.standardError = FileHandle.standardError

        let lock = NSLock()
        var acc = Data()
        var readyURL: URL?
        let sem = DispatchSemaphore(value: 0)
        pipe.fileHandleForReading.readabilityHandler = { handle in
            let chunk = handle.availableData
            guard !chunk.isEmpty else { return }
            lock.lock()
            acc.append(chunk)
            let snapshot = acc
            lock.unlock()
            guard let text = String(data: snapshot, encoding: .utf8) else { return }
            for line in text.split(whereSeparator: \.isNewline) {
                if line.hasPrefix("READY ") {
                    let raw = line.dropFirst(6).trimmingCharacters(in: .whitespacesAndNewlines)
                    if let url = URL(string: String(raw)) {
                        lock.lock()
                        readyURL = url
                        lock.unlock()
                        handle.readabilityHandler = nil
                        sem.signal()
                        return
                    }
                }
            }
        }

        try proc.run()
        server = proc
        let waitResult = sem.wait(timeout: .now() + 12)
        pipe.fileHandleForReading.readabilityHandler = nil

        lock.lock()
        let url = readyURL
        lock.unlock()
        if let url {
            return url
        }
        if waitResult == .timedOut {
            proc.terminate()
            throw NSError(
                domain: "SelfCheck",
                code: 3,
                userInfo: [NSLocalizedDescriptionKey: "等待本地服务就绪超时。"]
            )
        }
        throw NSError(
            domain: "SelfCheck",
            code: 2,
            userInfo: [NSLocalizedDescriptionKey: "Python 服务未能打印就绪地址。"]
        )
    }

    private func buildMenu() {
        let appName = "电脑自检"
        let mainMenu = NSMenu()

        let appItem = NSMenuItem()
        mainMenu.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "隐藏\(appName)", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "退出\(appName)", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu

        let editItem = NSMenuItem()
        mainMenu.addItem(editItem)
        let editMenu = NSMenu(title: "编辑")
        editMenu.addItem(withTitle: "剪切", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "复制", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "粘贴", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "全选", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = editMenu

        NSApp.mainMenu = mainMenu
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
