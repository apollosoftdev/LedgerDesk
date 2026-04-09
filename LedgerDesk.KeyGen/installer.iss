; Inno Setup Script for LedgerDesk Key Generator
; Download Inno Setup from https://jrsoftware.org/isinfo.php

#define MyAppName "LedgerDesk KeyGen"
#define MyAppVersion "1.0.1"
#define MyAppPublisher "Apollo Software, Inc."
#define MyAppExeName "LedgerDesk.KeyGen.exe"

[Setup]
AppId={{E7A1F3B2-5D8C-4E6A-B9D2-3F4A5B6C7D8E}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\LedgerDesk KeyGen
DefaultGroupName={#MyAppName}
OutputDir=installer_output
OutputBaseFilename=LedgerDeskKeyGenSetup
SetupIconFile=Assets\app.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "bin\publish\x64\Release\net9.0-windows10.0.22621.0\win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.pdb"

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{userdesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
