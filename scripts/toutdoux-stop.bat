@echo off
REM ═══ ToutDoux — arret du serveur ═══
taskkill /FI "WINDOWTITLE eq ToutDoux Server*" /T /F >nul 2>&1
echo Serveur ToutDoux arrete.
timeout /t 2 >nul
