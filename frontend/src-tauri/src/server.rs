use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;

use crate::AppState;

/// Holds the running server child process
pub struct ServerProcess {
    pub child: Option<CommandChild>,
}

/// Holds the running MCP server child process
pub struct McpProcess {
    pub child: Option<CommandChild>,
}

/// Build a shell command that finds the correct Python (with required module) and runs a command.
/// Tries the project venv first, then falls back to system python3.
fn build_python_command(module_check: &str, py_args: &str) -> String {
    format!(
        r#"for py in "$HOME/Achilles/.venv/bin/python3" "$HOME/achilles/.venv/bin/python3" python3; do if command -v "$py" >/dev/null 2>&1 && "$py" -c "import {module_check}" 2>/dev/null; then exec "$py" {py_args}; fi; done; exit 1"#,
        module_check = module_check,
        py_args = py_args,
    )
}

/// Spawn a Python command through the user's login shell so PATH/venv are inherited.
fn spawn_via_login_shell(
    app: &tauri::AppHandle,
    py_command: &str,
) -> Result<CommandChild, String> {
    let shell = app.shell();

    // Use the user's login shell to inherit PATH, pyenv, conda, venv, etc.
    let result = shell
        .command("/bin/zsh")
        .args(["-l", "-c", py_command])
        .spawn();

    match result {
        Ok((_rx, child)) => Ok(child),
        Err(e) => {
            // Fallback: try /bin/bash
            let result2 = shell
                .command("/bin/bash")
                .args(["-l", "-c", py_command])
                .spawn();
            match result2 {
                Ok((_rx, child)) => Ok(child),
                Err(_) => Err(format!("Failed to spawn command: {}", e)),
            }
        }
    }
}

pub async fn start_backend_server(app: tauri::AppHandle) {
    // Try sidecar first
    if start_sidecar(&app).await {
        return;
    }
    // Fallback: system python via login shell
    start_with_python(&app).await;
}

async fn start_sidecar(app: &tauri::AppHandle) -> bool {
    let shell = app.shell();
    let sidecar = match shell.sidecar("achilles-server") {
        Ok(cmd) => cmd,
        Err(_) => return false,
    };

    match sidecar.spawn() {
        Ok((_rx, child)) => {
            if let Some(state) = app.try_state::<Mutex<ServerProcess>>() {
                if let Ok(mut proc) = state.lock() {
                    proc.child = Some(child);
                }
            }
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
    let cmd = build_python_command(
        "uvicorn",
        "-m uvicorn achilles.main:app --host 127.0.0.1 --port 8900",
    );

    match spawn_via_login_shell(app, &cmd) {
        Ok(child) => {
            if let Some(state) = app.try_state::<Mutex<ServerProcess>>() {
                if let Ok(mut proc) = state.lock() {
                    proc.child = Some(child);
                }
            }
            // Poll for startup
            for _ in 0..15 {
                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                if check_health("http://127.0.0.1:8900").await {
                    update_state(app, true);
                    app.emit("server-status", "running").unwrap_or_default();
                    return;
                }
            }
        }
        Err(_) => {}
    }

    app.emit("server-status", "failed").unwrap_or_default();
}

pub async fn do_start_server(app: &tauri::AppHandle) -> Result<(), String> {
    if check_health("http://127.0.0.1:8900").await {
        update_state(app, true);
        return Ok(());
    }

    let cmd = build_python_command(
        "uvicorn",
        "-m uvicorn achilles.main:app --host 127.0.0.1 --port 8900",
    );
    let child = spawn_via_login_shell(app, &cmd)?;

    if let Some(state) = app.try_state::<Mutex<ServerProcess>>() {
        if let Ok(mut proc) = state.lock() {
            proc.child = Some(child);
        }
    }
    Ok(())
}

pub fn do_stop_server(app: &tauri::AppHandle) -> Result<(), String> {
    if let Some(state) = app.try_state::<Mutex<ServerProcess>>() {
        if let Ok(mut proc) = state.lock() {
            if let Some(child) = proc.child.take() {
                child.kill().map_err(|e| e.to_string())?;
            }
        }
    }
    update_state(app, false);
    app.emit("server-status", "stopped").unwrap_or_default();
    Ok(())
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

// --- MCP Server Management ---

pub async fn do_start_mcp(app: &tauri::AppHandle) -> Result<(), String> {
    if check_mcp_port().await {
        update_mcp_state(app, true);
        return Ok(());
    }

    let cmd = build_python_command(
        "achilles.mcp_server",
        "-m achilles.mcp_server --port 8901 --host 127.0.0.1 --transport sse",
    );
    let child = spawn_via_login_shell(app, &cmd)?;

    if let Some(state) = app.try_state::<Mutex<McpProcess>>() {
        if let Ok(mut proc) = state.lock() {
            proc.child = Some(child);
        }
    }

    // Poll for startup — must confirm here before returning to frontend
    for _ in 0..10 {
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        if check_mcp_port().await {
            update_mcp_state(app, true);
            app.emit("mcp-status", "running").unwrap_or_default();
            return Ok(());
        }
    }
    Ok(())
}

pub fn do_stop_mcp(app: &tauri::AppHandle) -> Result<(), String> {
    if let Some(state) = app.try_state::<Mutex<McpProcess>>() {
        if let Ok(mut proc) = state.lock() {
            if let Some(child) = proc.child.take() {
                child.kill().map_err(|e| e.to_string())?;
            }
        }
    }
    update_mcp_state(app, false);
    app.emit("mcp-status", "stopped").unwrap_or_default();
    Ok(())
}

async fn check_mcp_port() -> bool {
    match reqwest::Client::new()
        .get("http://127.0.0.1:8901/health")
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
    {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}

fn update_mcp_state(app: &tauri::AppHandle, running: bool) {
    if let Some(state) = app.try_state::<Mutex<AppState>>() {
        if let Ok(mut s) = state.lock() {
            s.mcp_running = running;
        }
    }
}
