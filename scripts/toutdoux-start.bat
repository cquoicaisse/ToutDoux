@echo off
REM ═══ ToutDoux — lancement au demarrage de Windows ═══
REM Ce script demarre le serveur (fenetre reduite) puis ouvre Firefox sur la page.
REM Un raccourci vers ce fichier doit etre place dans shell:startup

REM Se placer a la racine du projet (le dossier parent de \scripts)
cd /d "%~dp0\.."

REM Demarrer le serveur Node en fenetre reduite (si pas deja lance)
tasklist /FI "WINDOWTITLE eq ToutDoux Server*" 2>nul | find /i "cmd.exe" >nul
if errorlevel 1 (
    start "ToutDoux Server" /min cmd /k "node server\index.js"
)

REM Laisser 2 secondes au serveur pour demarrer
timeout /t 2 /nobreak >nul

REM Ouvrir la page (adapter le chemin Firefox si besoin)
start "" "C:\Program Files\Mozilla Firefox\firefox.exe" "http://localhost:3000/?vue=chambre"
