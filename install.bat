@echo off
setlocal
cd /d "%~dp0"
title Haulforce Tracker Setup
echo ==============================================
echo  Haulforce Advanced Tracker - Setup
echo ==============================================
echo.

rem ---- Node.js: auto-install via winget if missing ----
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required and was not found.
  where winget >nul 2>nul
  if errorlevel 1 (
    echo [X] Please install Node.js 20 LTS or newer from https://nodejs.org and run setup again.
    pause & exit /b 1
  )
  echo Installing Node.js LTS automatically...
  winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
  if errorlevel 1 ( echo [X] Node.js install failed. Install it from https://nodejs.org and re-run. & pause & exit /b 1 )
  echo Node.js installed. Please CLOSE this window and run install.bat again
  echo so the new Node.js is picked up.
  pause & exit /b 0
)
for /f "tokens=1 delims=." %%v in ('node -e "console.log(process.versions.node)"') do set NODEMAJOR=%%v
if %NODEMAJOR% LSS 20 ( echo [X] Node.js 20 or newer is required. & pause & exit /b 1 )

echo [1/4] Installing application files (a few minutes on first run)...
call npm install --no-audit --no-fund --loglevel=error
if errorlevel 1 ( echo Install failed. Check your internet connection. & pause & exit /b 1 )

echo [2/4] Generating the Prisma client...
if exist "vendor\.prisma" (
  xcopy /e /i /y /q "vendor\.prisma" "node_modules\.prisma" >nul
)
call npx prisma generate
if errorlevel 1 ( echo Failed to generate database client. & pause & exit /b 1 )

echo [3/4] Installing the private database for this PC...
pushd desktop
call npm install --no-audit --no-fund --loglevel=error
popd
if errorlevel 1 ( echo Database install failed. & pause & exit /b 1 )

echo [4/4] Setting up your database and admin account...
set /p HF_ADMIN_EMAIL=Admin email [admin@haulforce.ph]: 
set /p HF_ADMIN_PASSWORD=Admin password [admin123]: 
node desktop\setup.mjs
if errorlevel 1 ( echo Setup failed. & pause & exit /b 1 )

echo.
echo Creating shortcuts...
powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$desk = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Haulforce Tracker.lnk');" ^
  "$desk.TargetPath = '%~dp0Start Haulforce.bat'; $desk.WorkingDirectory = '%~dp0';" ^
  "$desk.IconLocation = '%~dp0assets\haulforce.ico'; $desk.Description = 'Haulforce Advanced Tracker'; $desk.Save();" ^
  "$sm = $ws.CreateShortcut([Environment]::GetFolderPath('Programs') + '\Haulforce Tracker.lnk');" ^
  "$sm.TargetPath = '%~dp0Start Haulforce.bat'; $sm.WorkingDirectory = '%~dp0';" ^
  "$sm.IconLocation = '%~dp0assets\haulforce.ico'; $sm.Description = 'Haulforce Advanced Tracker'; $sm.Save()"

echo Registering in Apps and Features...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HaulforceTracker" /f /v DisplayName /t REG_SZ /d "Haulforce Advanced Tracker" >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HaulforceTracker" /f /v DisplayVersion /t REG_SZ /d "1.2.0" >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HaulforceTracker" /f /v Publisher /t REG_SZ /d "Haulforce Trucking" >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HaulforceTracker" /f /v InstallLocation /t REG_SZ /d "%~dp0" >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HaulforceTracker" /f /v DisplayIcon /t REG_SZ /d "%~dp0assets\haulforce.ico" >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HaulforceTracker" /f /v UninstallString /t REG_SZ /d "\"%~dp0uninstall.bat\"" >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HaulforceTracker" /f /v NoModify /t REG_DWORD /d 1 >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HaulforceTracker" /f /v NoRepair /t REG_DWORD /d 1 >nul

echo.
echo ==============================================
echo  Installed! Start the app from the desktop or
echo  Start Menu: "Haulforce Tracker"
echo ==============================================
pause
