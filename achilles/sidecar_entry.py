"""Single entry point for the bundled Achilles sidecar binary.

Launches both the FastAPI backend (port 8900) and MCP server (port 8901)
in a single process. Used when the app is distributed via App Store.
"""

import asyncio
import logging
import signal
import sys
import threading

import uvicorn


def run_mcp_server():
    """Run MCP server in a separate thread."""
    from achilles.mcp_server import main as mcp_main

    try:
        mcp_main()
    except Exception as e:
        logging.error("MCP server failed: %s", e)


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    )
    logger = logging.getLogger("achilles.sidecar")

    # Start MCP server in background thread
    mcp_thread = threading.Thread(target=run_mcp_server, daemon=True)
    mcp_thread.start()
    logger.info("MCP server thread started")

    # Run FastAPI backend in main thread
    logger.info("Starting FastAPI backend on 127.0.0.1:8900")
    uvicorn.run(
        "achilles.main:app",
        host="127.0.0.1",
        port=8900,
        log_level="info",
    )


if __name__ == "__main__":
    main()
