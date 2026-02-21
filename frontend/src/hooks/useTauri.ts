import { useCallback, useRef } from "react";
import { useStore } from "../store";

// Detect if running inside Tauri
const isTauri = !!(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__;

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
let invokeModule: InvokeFn | null = null;

async function getInvoke(): Promise<InvokeFn | null> {
  if (!isTauri) return null;
  if (invokeModule) return invokeModule;
  try {
    const mod = await import("@tauri-apps/api/core");
    invokeModule = mod.invoke;
    return invokeModule;
  } catch {
    return null;
  }
}

export function useServerManager() {
  const { addToast, checkServerHealth, checkMcpHealth } = useStore();
  const startingRef = useRef(false);
  const mcpStartingRef = useRef(false);

  const startServer = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;

    if (isTauri) {
      try {
        const invoke = await getInvoke();
        if (invoke) {
          await invoke("start_server");
          addToast({ type: "info", title: "Starting server...", message: "The backend server is starting up" });
          // Poll for health
          for (let i = 0; i < 15; i++) {
            await new Promise((r) => setTimeout(r, 1000));
            await checkServerHealth();
            const { serverStatus } = useStore.getState();
            if (serverStatus.running) {
              addToast({ type: "success", title: "Server online", message: "Backend server is now running" });
              startingRef.current = false;
              return;
            }
          }
          addToast({ type: "error", title: "Server failed to start", message: "Timeout waiting for server. Check terminal for errors." });
        }
      } catch (err) {
        addToast({ type: "error", title: "Failed to start server", message: String(err) });
      }
    } else {
      // Browser mode - try the helper endpoint approach
      addToast({
        type: "warning",
        title: "Start server manually",
        message: "Run: python -m achilles.main",
        duration: 8000,
      });
    }
    startingRef.current = false;
  }, [addToast, checkServerHealth]);

  const stopServer = useCallback(async () => {
    if (isTauri) {
      try {
        const invoke = await getInvoke();
        if (invoke) {
          await invoke("stop_server");
          addToast({ type: "info", title: "Server stopped" });
          await checkServerHealth();
        }
      } catch (err) {
        addToast({ type: "error", title: "Failed to stop server", message: String(err) });
      }
    }
  }, [addToast, checkServerHealth]);

  const restartServer = useCallback(async () => {
    if (isTauri) {
      await stopServer();
      await new Promise((r) => setTimeout(r, 1000));
      await startServer();
    }
  }, [startServer, stopServer]);

  const startMcpServer = useCallback(async () => {
    if (mcpStartingRef.current) return;
    mcpStartingRef.current = true;

    if (isTauri) {
      try {
        const invoke = await getInvoke();
        if (invoke) {
          await invoke("start_mcp_server");
          addToast({ type: "info", title: "Starting MCP server...", message: "The MCP server is starting on port 8901" });
          for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 1000));
            await checkMcpHealth();
            const { mcpStatus } = useStore.getState();
            if (mcpStatus.running) {
              addToast({ type: "success", title: "MCP server online", message: "AI tools can now connect to the vault" });
              mcpStartingRef.current = false;
              return;
            }
          }
          addToast({ type: "error", title: "MCP server failed to start", message: "Timeout waiting for MCP server" });
        }
      } catch (err) {
        addToast({ type: "error", title: "Failed to start MCP server", message: String(err) });
      }
    } else {
      addToast({
        type: "warning",
        title: "Start MCP server manually",
        message: "Run: python -m achilles.mcp_server",
        duration: 8000,
      });
    }
    mcpStartingRef.current = false;
  }, [addToast, checkMcpHealth]);

  const stopMcpServer = useCallback(async () => {
    if (isTauri) {
      try {
        const invoke = await getInvoke();
        if (invoke) {
          await invoke("stop_mcp_server");
          addToast({ type: "info", title: "MCP server stopped" });
          await checkMcpHealth();
        }
      } catch (err) {
        addToast({ type: "error", title: "Failed to stop MCP server", message: String(err) });
      }
    }
  }, [addToast, checkMcpHealth]);

  return {
    isTauri,
    startServer,
    stopServer,
    restartServer,
    startMcpServer,
    stopMcpServer,
  };
}
