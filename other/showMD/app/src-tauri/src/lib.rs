use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::Emitter;

fn is_markdown_path(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    lower.ends_with(".md") || lower.ends_with(".markdown") || lower.ends_with(".txt")
}

fn should_skip_name(name: &str) -> bool {
    name.starts_with('.')
        || matches!(
            name,
            "node_modules" | "target" | "dist" | ".git" | ".turbo" | "gen"
        )
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DirEntryDto {
    name: String,
    path: String,
    is_dir: bool,
    is_markdown: bool,
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<DirEntryDto>, String> {
    let dir = std::path::Path::new(&path);
    if !dir.is_dir() {
        return Err("不是文件夹".into());
    }
    let mut entries = Vec::new();
    for entry in std::fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().into_owned();
        if should_skip_name(&name) {
            continue;
        }
        let full = entry.path();
        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
        let is_markdown = is_markdown_path(&full.to_string_lossy());
        if is_dir || is_markdown {
            entries.push(DirEntryDto {
                name,
                path: full.to_string_lossy().into_owned(),
                is_dir,
                is_markdown,
            });
        }
    }
    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(entries)
}

#[tauri::command]
fn read_markdown(path: String) -> Result<String, String> {
    if !is_markdown_path(&path) {
        return Err("只支持 .md / .markdown / .txt".into());
    }
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_markdown(path: String, contents: String) -> Result<(), String> {
    if !is_markdown_path(&path) {
        return Err("只支持 .md / .markdown / .txt".into());
    }
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

fn build_menu(app: &tauri::AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let new_item = MenuItem::with_id(app, "new", "新建", true, Some("CmdOrCtrl+N"))?;
    let open_item = MenuItem::with_id(app, "open", "打开…", true, Some("CmdOrCtrl+O"))?;
    let open_folder_item = MenuItem::with_id(
        app,
        "open_folder",
        "打开文件夹…",
        true,
        Some("Shift+CmdOrCtrl+O"),
    )?;
    let save_item = MenuItem::with_id(app, "save", "保存", true, Some("CmdOrCtrl+S"))?;
    let save_as_item =
        MenuItem::with_id(app, "save_as", "另存为…", true, Some("Shift+CmdOrCtrl+S"))?;

    let app_menu = Submenu::with_items(
        app,
        "showMD",
        true,
        &[
            &PredefinedMenuItem::about(app, None, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, None)?,
            &PredefinedMenuItem::hide_others(app, None)?,
            &PredefinedMenuItem::show_all(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )?;

    let file_menu = Submenu::with_items(
        app,
        "文件",
        true,
        &[
            &new_item,
            &open_item,
            &open_folder_item,
            &PredefinedMenuItem::separator(app)?,
            &save_item,
            &save_as_item,
        ],
    )?;

    let edit_menu = Submenu::with_items(
        app,
        "编辑",
        true,
        &[
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )?;

    Menu::with_items(app, &[&app_menu, &file_menu, &edit_menu])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_markdown,
            write_markdown,
            list_dir
        ])
        .setup(|app| {
            let menu = build_menu(app.handle())?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            if matches!(id, "new" | "open" | "open_folder" | "save" | "save_as") {
                let _ = app.emit(id, ());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running showMD");
}
