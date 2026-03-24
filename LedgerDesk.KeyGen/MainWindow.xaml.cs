using System.Security.Cryptography;
using System.Text;
using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Windows.ApplicationModel.DataTransfer;
using WinRT.Interop;

namespace LedgerDesk.KeyGen;

public sealed partial class MainWindow : Window
{
    // Must match LicenseService.Salt in the main app
    private const string Salt = "LedgerDesk-2026-License-Salt";

    public MainWindow()
    {
        this.InitializeComponent();
        this.Title = "LedgerDesk Key Generator";

        var hwnd = WindowNative.GetWindowHandle(this);
        var windowId = Microsoft.UI.Win32Interop.GetWindowIdFromWindow(hwnd);
        var appWindow = AppWindow.GetFromWindowId(windowId);
        appWindow.Resize(new Windows.Graphics.SizeInt32(520, 500));
    }

    private void Generate_Click(object sender, RoutedEventArgs e)
    {
        var mac = MacInput.Text?.Trim() ?? "";

        if (string.IsNullOrEmpty(mac))
        {
            ShowError("Please enter a MAC address.");
            return;
        }

        // Clean MAC address
        mac = mac.ToUpperInvariant().Replace("-", "").Replace(":", "").Replace(" ", "");

        if (mac.Length != 12 || !mac.All(c => "0123456789ABCDEF".Contains(c)))
        {
            ShowError("Invalid MAC address. Expected 12 hex characters (e.g. AABBCCDDEEFF).");
            return;
        }

        var key = GenerateKey(mac);
        ResultKey.Text = key;
        ResultPanel.Visibility = Visibility.Visible;
        ErrorText.Visibility = Visibility.Collapsed;
    }

    private void Copy_Click(object sender, RoutedEventArgs e)
    {
        var package = new DataPackage();
        package.SetText(ResultKey.Text);
        Clipboard.SetContent(package);
    }

    private void ShowError(string message)
    {
        ErrorText.Text = message;
        ErrorText.Visibility = Visibility.Visible;
        ResultPanel.Visibility = Visibility.Collapsed;
    }

    private static string GenerateKey(string macAddress)
    {
        var keyBytes = Encoding.UTF8.GetBytes(Salt);
        var macBytes = Encoding.UTF8.GetBytes(macAddress);

        var hmac = HMACSHA256.HashData(keyBytes, macBytes);

        var sb = new StringBuilder();
        for (int i = 0; i < 25; i++)
        {
            sb.Append(hmac[i % hmac.Length] % 10);
            if (i % 5 == 4 && i < 24)
                sb.Append('-');
        }

        return sb.ToString();
    }
}
