@echo off
cd /d "%~dp0"
start "JINAYAT Server" py -m http.server 8080
ping 127.0.0.1 -n 2 > nul
start http://localhost:8080/index.html
