using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;

namespace LedgerDesk.Services;

public class LicenseService
{
    private readonly DatabaseService _db;

    // Shared secret salt — must match KeyGen utility
    internal const string Salt = "LedgerDesk-2026-License-Salt";
    internal const string SnSalt = "LedgerDesk-2026-SN-Salt";

    public LicenseService(DatabaseService db)
    {
        _db = db;
    }

    private static string GetRawMacAddress()
    {
        var nic = NetworkInterface.GetAllNetworkInterfaces()
            .Where(n => n.OperationalStatus == OperationalStatus.Up)
            .Where(n => n.NetworkInterfaceType == NetworkInterfaceType.Ethernet ||
                        n.NetworkInterfaceType == NetworkInterfaceType.Wireless80211)
            .OrderByDescending(n => n.Speed)
            .FirstOrDefault();

        if (nic is null)
        {
            nic = NetworkInterface.GetAllNetworkInterfaces()
                .FirstOrDefault(n => n.NetworkInterfaceType != NetworkInterfaceType.Loopback &&
                                     n.GetPhysicalAddress().GetAddressBytes().Length > 0);
        }

        if (nic is null) return "000000000000";

        var bytes = nic.GetPhysicalAddress().GetAddressBytes();
        return BitConverter.ToString(bytes).Replace("-", "").ToUpperInvariant();
    }

    /// <summary>
    /// Generates a 4x4 serial number from the MAC address (e.g. A1B2-C3D4-E5F6-7890).
    /// </summary>
    public static string GenerateSerialNumber(string macAddress)
    {
        var mac = macAddress.ToUpperInvariant().Replace("-", "").Replace(":", "");
        var keyBytes = Encoding.UTF8.GetBytes(SnSalt);
        var macBytes = Encoding.UTF8.GetBytes(mac);

        var hash = HMACSHA256.HashData(keyBytes, macBytes);

        var sb = new StringBuilder();
        for (int i = 0; i < 8; i++)
        {
            sb.Append(hash[i].ToString("X2"));
            if (i % 2 == 1 && i < 7)
                sb.Append('-');
        }

        return sb.ToString();
    }

    public string GetSerialNumber()
    {
        return GenerateSerialNumber(GetRawMacAddress());
    }

    /// <summary>
    /// Generates a new random 4-digit challenge code and stores it.
    /// </summary>
    public string GenerateChallenge()
    {
        var code = RandomNumberGenerator.GetInt32(1000, 10000).ToString();
        _db.SetSetting("license_challenge", code);
        return code;
    }

    /// <summary>
    /// Gets the current stored challenge code, or generates a new one.
    /// </summary>
    public string GetOrCreateChallenge()
    {
        var existing = _db.GetSetting("license_challenge");
        if (!string.IsNullOrEmpty(existing)) return existing;
        return GenerateChallenge();
    }

    /// <summary>
    /// Generates a license key from SN + challenge. Format: 5 groups of 5 digits.
    /// Each challenge produces a different key for the same SN.
    /// </summary>
    public static string GenerateKey(string serialNumber, string challenge)
    {
        var input = serialNumber.ToUpperInvariant().Replace("-", "") + ":" + challenge;
        var keyBytes = Encoding.UTF8.GetBytes(Salt);
        var inputBytes = Encoding.UTF8.GetBytes(input);

        var hmac = HMACSHA256.HashData(keyBytes, inputBytes);

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
        var sn = GetSerialNumber();
        var challenge = GetOrCreateChallenge();
        var expected = GenerateKey(sn, challenge);
        return string.Equals(inputKey.Trim(), expected, StringComparison.Ordinal);
    }

    public bool IsActivated()
    {
        var storedKey = _db.GetSetting("license_key");
        if (string.IsNullOrEmpty(storedKey)) return false;

        var sn = GetSerialNumber();
        var challenge = _db.GetSetting("license_challenge") ?? "";
        var expected = GenerateKey(sn, challenge);
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
        _db.DeleteSetting("license_challenge");
    }
}
