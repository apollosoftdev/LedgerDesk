namespace LedgerDesk.Services;

public class SettingsService
{
    private readonly DatabaseService _db;

    public SettingsService(DatabaseService db)
    {
        _db = db;
    }

    public string? Get(string key) => _db.GetSetting(key);

    public string Get(string key, string defaultValue) => _db.GetSetting(key) ?? defaultValue;

    public void Set(string key, string value) => _db.SetSetting(key, value);

    public void Delete(string key) => _db.DeleteSetting(key);

    // Typed helpers
    public bool GetBool(string key, bool defaultValue = false)
    {
        var val = _db.GetSetting(key);
        return val is not null ? bool.Parse(val) : defaultValue;
    }

    public void SetBool(string key, bool value) => Set(key, value.ToString());
}
