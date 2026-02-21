use std::sync::Mutex;
use tauri::State;
use tauri_plugin_autostart::MacosLauncher;

mod server;

pub struct AppState {
    pub server_running: bool,
    pub server_port: u16,
    pub api_url: String,
    pub mcp_running: bool,
    pub mcp_port: u16,
    pub mcp_url: String,
}

#[tauri::command]
fn get_server_status(state: State<'_, Mutex<AppState>>) -> Result<bool, String> {
    let s = state.lock().map_err(|e| e.to_string())?;
    Ok(s.server_running)
}

#[tauri::command]
fn get_api_url(state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let s = state.lock().map_err(|e| e.to_string())?;
    Ok(s.api_url.clone())
}

#[tauri::command]
async fn check_server_health(state: State<'_, Mutex<AppState>>) -> Result<bool, String> {
    let url = {
        let s = state.lock().map_err(|e| e.to_string())?;
        format!("{}/health", s.api_url)
    };
    match reqwest::get(&url).await {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn start_server(app: tauri::AppHandle) -> Result<(), String> {
    server::do_start_server(&app).await
}

#[tauri::command]
fn stop_server(app: tauri::AppHandle) -> Result<(), String> {
    server::do_stop_server(&app)
}

#[tauri::command]
async fn start_mcp_server(app: tauri::AppHandle) -> Result<(), String> {
    server::do_start_mcp(&app).await
}

#[tauri::command]
fn stop_mcp_server(app: tauri::AppHandle) -> Result<(), String> {
    server::do_stop_mcp(&app)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .plugin(tauri_plugin_process::init())
        .manage(Mutex::new(AppState {
            server_running: false,
            server_port: 8900,
            api_url: "http://127.0.0.1:8900".to_string(),
            mcp_running: false,
            mcp_port: 8901,
            mcp_url: "http://127.0.0.1:8901".to_string(),
        }))
        .manage(Mutex::new(server::ServerProcess { child: None }))
        .manage(Mutex::new(server::McpProcess { child: None }))
        .invoke_handler(tauri::generate_handler![
            get_server_status,
            get_api_url,
            check_server_health,
            start_server,
            stop_server,
            start_mcp_server,
            stop_mcp_server,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();
            // Start the Python backend server as a sidecar
            tauri::async_runtime::spawn(async move {
                server::start_backend_server(app_handle).await;
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Hide to tray instead of closing
                api.prevent_close();
                window.hide().unwrap_or_default();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Achilles Vault");
}
