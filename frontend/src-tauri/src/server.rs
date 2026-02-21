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
        Ok((_rx, child)) => {
            // Store the child process
            if let Some(state) = app.try_state::<Mutex<ServerProcess>>() {
                if let Ok(mut proc) = state.lock() {
                    proc.child = Some(child);
                }
            }

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

    // Try multiple Python executables
    let python_cmds = ["python3", "python"];

    for python_cmd in &python_cmds {
        let result = shell
            .command(python_cmd)
            .args(["-m", "uvicorn", "achilles.main:app", "--host", "127.0.0.1", "--port", "8900"])
            .spawn();

        match result {
            Ok((_rx, child)) => {
                // Store the child process
                if let Some(state) = app.try_state::<Mutex<ServerProcess>>() {
                    if let Ok(mut proc) = state.lock() {
                        proc.child = Some(child);
                    }
                }

                // Wait for server to start
                for _ in 0..15 {
                    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                    if check_health("http://127.0.0.1:8900").await {
                        update_state(app, true);
                        app.emit("server-status", "running").unwrap_or_default();
                        return;
                    }
                }
                // This python command was found but server didn't start, continue trying
            }
            Err(_) => continue,
        }
    }

    app.emit("server-status", "failed").unwrap_or_default();
}

pub async fn do_start_server(app: &tauri::AppHandle) -> Result<(), String> {
    // Check if already running
    if check_health("http://127.0.0.1:8900").await {
        update_state(app, true);
        return Ok(());
    }

    let shell = app.shell();
    let python_cmds = ["python3", "python"];

    for python_cmd in &python_cmds {
        let result = shell
            .command(python_cmd)
            .args(["-m", "uvicorn", "achilles.main:app", "--host", "127.0.0.1", "--port", "8900"])
            .spawn();

        match result {
            Ok((_rx, child)) => {
                if let Some(state) = app.try_state::<Mutex<ServerProcess>>() {
                    if let Ok(mut proc) = state.lock() {
                        proc.child = Some(child);
                    }
                }
                return Ok(());
            }
            Err(_) => continue,
        }
    }

    Err("Could not find python3 or python. Please install Python 3.11+.".to_string())
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
    // Check if already running
    if check_mcp_port().await {
        update_mcp_state(app, true);
        return Ok(());
    }

    let shell = app.shell();
    let python_cmds = ["python3", "python"];

    for python_cmd in &python_cmds {
        let result = shell
            .command(python_cmd)
            .args(["-m", "achilles.mcp_server", "--port", "8901", "--host", "127.0.0.1", "--transport", "sse"])
            .spawn();

        match result {
            Ok((_rx, child)) => {
                if let Some(state) = app.try_state::<Mutex<McpProcess>>() {
                    if let Ok(mut proc) = state.lock() {
                        proc.child = Some(child);
                    }
                }

                // Wait for MCP server to start (poll up to 10 seconds)
                for _ in 0..10 {
                    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                    if check_mcp_port().await {
                        update_mcp_state(app, true);
                        app.emit("mcp-status", "running").unwrap_or_default();
                        return Ok(());
                    }
                }
                return Ok(());
            }
            Err(_) => continue,
        }
    }

    Err("Could not find python3 or python to start MCP server.".to_string())
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
        .get("http://127.0.0.1:8901/sse")
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
