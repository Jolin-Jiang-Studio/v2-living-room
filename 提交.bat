@echo off
chcp 65001 >nul
echo ========================================
echo    AI Lab Website Auto Deploy Script
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Adding files...
git add index.html

echo [2/3] Committing...
git commit -m "Update website"

echo [3/3] Pushing to GitHub...
git push origin master

echo.
echo ========================================
echo    Done! Visit in 1-2 minutes:
echo    https://jolin-jiang-studio.github.io/v2-living-room/
echo ========================================
pause