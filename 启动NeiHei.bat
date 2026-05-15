@echo off
title NeiHei 节点编辑器
echo ========================================
echo   NeiHei 节点编辑器 - 启动中...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查依赖...
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 安装失败！请确保已安装 Node.js
        pause
        exit /b 1
    )
)

echo [2/3] 启动开发服务器...
echo 浏览器将自动打开 http://localhost:5173
echo.
echo 提示：按 Ctrl+C 可停止服务器
echo.

start http://localhost:5173
call npm run dev

pause
