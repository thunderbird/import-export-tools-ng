
if not defined npm_package_name ( 
	set targetBaseName=%1
) else (
	set targetBaseName=%npm_package_name%
)

if not defined npm_package_version ( 
	set targetVersion=%2
) else (
	set targetVersion=%npm_package_version%
)

echo %npm_package_name%  %npm_package_version%

rem get RDF version
FOR /F "tokens=* USEBACKQ" %%F IN (`node .\scripts\xml-util -get Description[\"em:version\"]`) DO (
SET installRDFVer=%%F
)

REM echo after %installRDFVer%

if %installRDFVer% neq %targetVersion% (
	echo Version Mismatch:  %installRDFVer% != %targetVersion%
	exit 1
)

set sourcePath=.\src
set targetPath=.\xpi

set targetName=%targetPath%\%targetBaseName%-%targetVersion%-tb.xpi

del "%targetName%"

call 7z a %targetName% %sourcePath%\* -x@%sourcePath%\.jpmignore

rem call 7z d %targetName% ./src/manifest.json

call 7z a %targetName% .\LICENSE
call 7z a %targetName% .\CHANGELOG.md

call 7z l %targetName%