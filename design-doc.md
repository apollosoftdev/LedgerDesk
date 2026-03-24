# LedgerDesk — Design Document

**Version:** 1.0
**Platform:** Windows Desktop (WinUI 3)
**Last Updated:** 2026-03-24

---

## 1. Overview

LedgerDesk is a desktop application for recording and managing personal or business transaction history, including orders, payments, and financial records. Designed for single-user use, protected by a hardware-bound license system and password authentication.

---

## 2. Authentication & Licensing

### 2.1 License Activation

- On first launch, a License Activation screen is displayed.
- The license key is hardware-bound, generated from the device's MAC address.
- License key format: 5 numeric segments (e.g., `12345-67890-11121-31415-16171`).
- If the license is invalid or absent, the app is locked and unusable.
- Once activated, the license is stored locally and not re-prompted unless reinstalled.

### 2.2 Password Login

- After license activation, a single password is required to log in (no username).
- The password is set on first run and can be changed in App Settings.
- No account system or cloud authentication is required.

### 2.3 Key Generator (Separate Utility App)

- A standalone utility application for administrators to generate license keys.
- **Input:** target device's MAC address.
- **Output:** a valid 5-part numeric license key derived from a deterministic algorithm.
- Distributed separately from the main app.

---

## 3. Dashboard

- Displays a summary view of all transaction records.
- Shows the total sum of all money amounts across all records (supports negative and zero values).
- Provides quick-access statistics: total records, total positive amount, total negative amount.
- Entry point to navigate to record list, settings, and adding new records.

---

## 4. Record Management

### 4.1 Record List (Data Table)

- Displays all transaction records in a paginated or scrollable data table.
- Columns: Date, Title, Category, Amount, and a preview indicator for images.
- Clicking any row opens a Record Detail Modal (read-only view with edit option).

### 4.2 Adding a New Record

Triggered by a "New Record" button. Opens a modal with the following fields:

| Field       | Details                                                                 |
|-------------|-------------------------------------------------------------------------|
| Images      | Multiple image upload via drag-and-drop; supports JPG, PNG, etc.        |
| Title       | Short text input                                                        |
| Category    | Dropdown selector (customizable via App Settings)                       |
| Description | Multi-line text area for detailed notes                                 |
| Amount      | Numeric input; allows positive, negative, or zero values                |
| Date        | Date picker defaulting to today; fully editable                         |

### 4.3 Record Detail Modal

- Opens when a row in the data table is clicked.
- Displays all fields: images (gallery/carousel), title, category, description, amount, and date.
- Includes Edit and Delete action buttons.

---

## 5. Search & Filter

- A persistent filter bar displayed above the data table.
- Filtering is real-time — results update as the user types or selects options.

| Filter       | Type                         |
|--------------|------------------------------|
| Title        | Text input (partial match)   |
| Category     | Dropdown / multi-select      |
| Description  | Text input (keyword search)  |
| Amount Range | Min / Max numeric inputs     |
| Date Range   | Start date / End date pickers|

- Multiple filters can be applied simultaneously.
- A "Clear Filters" button resets all active filters.

---

## 6. Categories

- Fully customizable by the user via App Settings.
- Default categories on first install: Income, Expense, Transfer, Other.
- Users can add, rename, and delete categories.
- Deleting a category prompts reassignment of affected records or leaves them uncategorized.

---

## 7. App Settings / Configuration

### 7.1 Security

- Change login password.

### 7.2 Categories

- Manage (add / rename / delete) transaction categories.

### 7.3 Language & Display

- **Language:** Switch between English and Chinese (Simplified).
- **Theme:** Toggle between Light Mode and Dark Mode.

### 7.4 UI Text Customization

- Users can override any displayed text label (button labels, field names, section headers).
- Changes stored in a local configuration file.
- "Reset to Default" option available per language.
- Allows adaptation to any terminology preference without code changes.

### 7.5 License Info

- Displays current license key and device MAC address.
- Option to deactivate/reset license (e.g., for migration to another machine).

---

## 8. Localization

- Full support for English and Chinese (Simplified).
- All UI elements, labels, error messages, and placeholders are translatable.
- Language can be switched at any time from Settings; the app reloads to apply.
- Combined with UI Text Customization (§7.4), every text string is user-editable per language.

---

## 9. Data Storage

- All records, settings, and configurations stored locally.
- No internet connection or cloud sync required.
- Images attached to records stored in a local app data folder.
- Data export (CSV or JSON) recommended for a future version.

---

## 10. Non-Functional Requirements

| Requirement   | Detail                                                            |
|---------------|-------------------------------------------------------------------|
| Performance   | Filter/search across 1,000+ records within 300ms                 |
| Offline       | Fully functional without internet access                          |
| Security      | License and password data stored in an encrypted local store      |
| Platform      | Windows desktop                                                   |
| Accessibility | Sufficient color contrast in both light and dark modes            |

---

## 11. Screen / Module Summary

| Screen / Module       | Description                                              |
|-----------------------|----------------------------------------------------------|
| License Activation    | First-launch license key entry screen                    |
| Login                 | Password entry screen                                    |
| Dashboard             | Summary stats and total amount display                   |
| Record List           | Searchable, filterable data table of all records         |
| New Record Modal      | Form for adding a new transaction record                 |
| Record Detail Modal   | Full view of a single record with edit/delete            |
| Settings Panel        | Password, categories, language, theme, text customization|
| Key Generator App     | Separate utility to generate hardware-bound license keys |

---

## 12. Out of Scope (v1.0)

- Multi-user / role-based access
- Cloud sync or remote backup
- Mobile version
- Import from external sources (bank statements, CSV)
- Recurring transactions / automation
