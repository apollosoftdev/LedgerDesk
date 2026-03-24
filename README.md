# LedgerDesk

A Windows desktop application for recording and managing personal or business transaction history — orders, payments, and financial records. Built with **WinUI 3** (Windows App SDK 1.8) + **.NET 9** + **SQLite**.

## Features

- **Hardware-bound license activation** with a separate key generator utility
- **Password-protected login** (single-user, no cloud auth)
- **Dashboard** — total records, total positive/negative amounts, overall balance
- **Transaction records** with title, category, description, amount, date, and image attachments
- **Real-time search & filter** — filter by title, category, description, amount range, and date range
- **Customizable categories** — add, rename, delete categories from settings
- **Localization** — English and Chinese (Simplified), with user-editable UI text labels
- **Light / Dark theme** toggle
- **Mica backdrop** with fallback to Desktop Acrylic
- **Custom title bar** extending content into the title bar
- **Fully offline** — all data stored locally via SQLite

## Prerequisites

1. **Windows 10** (v1809+) or **Windows 11**
2. **.NET 9 SDK** — [Download here](https://dotnet.microsoft.com/download/dotnet/9.0)

   ```powershell
   winget install Microsoft.DotNet.SDK.9
   ```

3. Verify installation:
   ```powershell
   dotnet --version
   # Should show 9.0.x
   ```

## How to Run

```bash
cd LedgerDesk

# Restore NuGet packages
dotnet restore

# Build and run (defaults to x64)
dotnet run
```

Or open in **Visual Studio 2022** (v17.12+) and press **F5**.

## Project Structure

```
LedgerDesk/
├── App.xaml / App.xaml.cs          # Application entry point
├── MainWindow.xaml / .xaml.cs      # Main UI — table, stats, dialogs, Mica backdrop
├── Models/
│   └── Product.cs                  # Data model with INotifyPropertyChanged
├── Data/
│   └── DatabaseHelper.cs           # SQLite init, seed, CRUD operations
├── Helpers/
│   └── BoolToVisibilityConverter.cs
├── LedgerDesk.csproj               # .NET 9 + WinAppSDK 1.8 + SQLite
├── design-doc.md                   # Product design document
├── app.manifest                    # DPI awareness
├── installer.iss                   # Inno Setup installer script
└── README.md
```

## Tech Stack

| Component       | Version                    |
|-----------------|----------------------------|
| .NET            | 9.0                        |
| Windows App SDK | 1.8.260317003              |
| WinUI 3         | Included in WinAppSDK 1.8  |
| SQLite          | Microsoft.Data.Sqlite 9.x  |
| Target Platform | Windows 10.0.22621.0       |
| Min Platform    | Windows 10.0.17763.0       |

## Data Storage

SQLite database auto-created at:
```
%LOCALAPPDATA%\LedgerDesk\ledgerdesk.db
```

All records, settings, and images are stored locally. No internet connection required.

## Documentation

- [Design Document](design-doc.md) — full product requirements and specifications
