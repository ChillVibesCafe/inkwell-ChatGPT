@echo off
title Inkwell - ChatGPT
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-inkwell.ps1"
if errorlevel 1 pause
