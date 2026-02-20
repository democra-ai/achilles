use tauri::{Emitter, Manager};
use tauri_plugin_shell::ShellExt;
use std::sync::Mutex;

use crate::AppState;

pub async fn start_backend_server(app: tauri::AppHandle) {
    // Try to use the bundled sidecar first, fall back to system python
    let sidecar_ok = start_sidecar(&app).await;

    if !sidecar_ok {
        // Fallback: try running with system python
        start_with_python(&app).await;
    }
}

async fn start_sidecar(app: &tauri::AppHandle) -> bool {
    let shell = app.shell();
    let sidecar = match shell.sidecar("achilles-server") {
        Ok(cmd) => cmd,
        Err(_) => return false,
    };

    match sidecar.spawn() {
        Ok((_rx, _child)) => {
            // Wait a moment then check health
            tokio::time::sleep(std::time::Duration::from_secs(3)).await;

            if check_health("http://127.0.0.1:8900").await {
                update_state(app, true);
                app.emit("server-status", "running").unwrap_or_default();
                return true;
            }
            false
        }
        Err(_) => false,
    }
}

async fn start_with_python(app: &tauri::AppHandle) {
    let shell = app.shell();
    let result = shell
        .command("python3")
        .args(["-m", "achilles.main"])
        .spawn();

    match result {
        Ok(_) => {
            // Wait for server to start
            for _ in 0..10 {
                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                if check_health("http://127.0.0.1:8900").await {
                    update_state(app, true);
                    app.emit("server-status", "running").unwrap_or_default();
                    return;
                }
            }
            app.emit("server-status", "failed").unwrap_or_default();
        }
        Err(_) => {
            app.emit("server-status", "failed").unwrap_or_default();
        }
    }
}

async fn check_health(base_url: &str) -> bool {
    let url = format!("{}/health", base_url);
    match reqwest::get(&url).await {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}

fn update_state(app: &tauri::AppHandle, running: bool) {
    if let Some(state) = app.try_state::<Mutex<AppState>>() {
        if let Ok(mut s) = state.lock() {
            s.server_running = running;
        }
    }
}
