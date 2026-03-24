using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;

namespace LedgerDesk.Services;

public class LicenseService
{
    private readonly DatabaseService _db;

    // Shared secret salt — must match KeyGen utility
    internal const string Salt = "LedgerDesk-2026-License-Salt";

    public LicenseService(DatabaseService db)
    {
        _db = db;
    }

    public string GetMacAddress()
    {
        var nic = NetworkInterface.GetAllNetworkInterfaces()
            .Where(n => n.OperationalStatus == OperationalStatus.Up)
            .Where(n => n.NetworkInterfaceType == NetworkInterfaceType.Ethernet ||
                        n.NetworkInterfaceType == NetworkInterfaceType.Wireless80211)
            .OrderByDescending(n => n.Speed)
            .FirstOrDefault();

        if (nic is null)
        {
            // Fallback: any non-loopback adapter
            nic = NetworkInterface.GetAllNetworkInterfaces()
                .FirstOrDefault(n => n.NetworkInterfaceType != NetworkInterfaceType.Loopback &&
                                     n.GetPhysicalAddress().GetAddressBytes().Length > 0);
        }

        if (nic is null) return "000000000000";

        var bytes = nic.GetPhysicalAddress().GetAddressBytes();
        return BitConverter.ToString(bytes).Replace("-", "").ToUpperInvariant();
    }

    public static string GenerateKey(string macAddress)
    {
        var mac = macAddress.ToUpperInvariant().Replace("-", "").Replace(":", "");
        var keyBytes = Encoding.UTF8.GetBytes(Salt);
        var macBytes = Encoding.UTF8.GetBytes(mac);

        var hmac = HMACSHA256.HashData(keyBytes, macBytes);

        // Convert hash bytes to 25 digits (5 groups of 5)
        var sb = new StringBuilder();
        for (int i = 0; i < 25; i++)
        {
            sb.Append(hmac[i % hmac.Length] % 10);
            if (i % 5 == 4 && i < 24)
                sb.Append('-');
        }

        return sb.ToString();
    }

    public bool ValidateKey(string inputKey)
    {
        var mac = GetMacAddress();
        var expected = GenerateKey(mac);
        return string.Equals(inputKey.Trim(), expected, StringComparison.Ordinal);
    }

    public bool IsActivated()
    {
        var storedKey = _db.GetSetting("license_key");
        if (string.IsNullOrEmpty(storedKey)) return false;

        var mac = GetMacAddress();
        var expected = GenerateKey(mac);
        return string.Equals(storedKey, expected, StringComparison.Ordinal);
    }

    public bool Activate(string key)
    {
        if (!ValidateKey(key)) return false;
        _db.SetSetting("license_key", key.Trim());
        return true;
    }

    public void Deactivate()
    {
        _db.DeleteSetting("license_key");
    }
}
