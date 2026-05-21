@echo off
echo 正在启动博客项目...
cd /d %~dp0
set PORT=3002
start http://localhost:%PORT%
echo Y | npm start
pause