using System.Security.Cryptography;
using System.Text;

namespace LedgerDesk.Services;

public class AuthService
{
    private readonly DatabaseService _db;

    public AuthService(DatabaseService db)
    {
        _db = db;
    }

    public bool IsPasswordSet()
    {
        return !string.IsNullOrEmpty(_db.GetSetting("password_hash"));
    }

    public void SetPassword(string password)
    {
        var hash = HashPassword(password);
        _db.SetSetting("password_hash", hash);
    }

    public bool VerifyPassword(string password)
    {
        var storedHash = _db.GetSetting("password_hash");
        if (string.IsNullOrEmpty(storedHash)) return false;

        var inputHash = HashPassword(password);
        return string.Equals(storedHash, inputHash, StringComparison.Ordinal);
    }

    public bool ChangePassword(string oldPassword, string newPassword)
    {
        if (!VerifyPassword(oldPassword)) return false;
        SetPassword(newPassword);
        return true;
    }

    private static string HashPassword(string password)
    {
        var bytes = Encoding.UTF8.GetBytes(password + "LedgerDesk-Password-Salt");
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);
    }
}
