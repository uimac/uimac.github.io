electron-packager . cabbage --platform=win32 --arch=x64 --version=1.2.6 --icon=img/cabbage.ico ^
& xcopy ..\reiko_bone.blend cabbage-win32-x64\ ^
& xcopy ..\blender-2.76b-bepuik_tools-0.6.0-win64 cabbage-win32-x64\blender-2.76b-bepuik_tools-0.6.0-win64\ /s/e/i
