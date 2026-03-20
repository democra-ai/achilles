# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['achilles/sidecar_entry.py'],
    pathex=[],
    binaries=[],
    datas=[('achilles/platforms/platforms.json', 'achilles/platforms')],
    hiddenimports=['achilles', 'achilles.main', 'achilles.config', 'achilles.crypto', 'achilles.database', 'achilles.auth', 'achilles.models', 'achilles.mcp_server', 'achilles.routers.auth_router', 'achilles.routers.projects_router', 'achilles.routers.secrets_router', 'achilles.routers.ai_router', 'achilles.routers.audit_router', 'achilles.routers.trash_router', 'achilles.routers.platforms_router', 'uvicorn.logging', 'uvicorn.loops.auto', 'uvicorn.protocols.http.auto', 'uvicorn.protocols.websockets.auto', 'uvicorn.lifespan.on', 'uvicorn.lifespan.off', 'aiosqlite', 'jose.jwt', 'passlib.handlers.argon2', 'argon2', 'mcp.server.fastmcp', 'slowapi', 'multipart', 'httptools', 'websockets'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'pandas', 'PIL'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='achilles-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch='arm64',
    codesign_identity=None,
    entitlements_file=None,
)
