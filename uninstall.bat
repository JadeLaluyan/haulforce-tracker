@echo off
setlocal
cd /d "%~dp0"
title Haulforce Tracker Uninstall
echo This removes Haulforce Tracker shortcuts and its entry in Apps and Features.
echo Your DATA (pgdata folder) is NOT deleted unless you delete this folder yourself.
set /p CONFIRM=Continue? (y/N): 
if /i not "%CONFIRM%"=="y" exit /b 0
powershell -NoProfile -Command ^
  "Remove-Item -ErrorAction SilentlyContinue ([Environment]::GetFolderPath('Desktop') + '\Haulforce Tracker.lnk');" ^
  "Remove-Item -ErrorAction SilentlyContinue ([Environment]::GetFolderPath('Programs') + '\Haulforce Tracker.lnk')"
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HaulforceTracker" /f >nul 2>nul
echo Done. To remove the app and ALL DATA completely, delete this folder:
echo   %~dp0
pause
