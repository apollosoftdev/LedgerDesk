using System.Reflection;
using System.Text.Json;

namespace LedgerDesk.Services;

public class LocalizationService
{
    private readonly DatabaseService _db;
    private Dictionary<string, string> _strings = new();
    private Dictionary<string, string> _defaults = new();
    private string _currentLanguage = "en";

    public event Action? LanguageChanged;

    public string CurrentLanguage => _currentLanguage;

    public LocalizationService(DatabaseService db)
    {
        _db = db;
    }

    public void Initialize(string language)
    {
        _currentLanguage = language;
        LoadLanguage(language);
    }

    public void SwitchLanguage(string language)
    {
        _currentLanguage = language;
        _db.SetSetting("language", language);
        LoadLanguage(language);
        LanguageChanged?.Invoke();
    }

    private void LoadLanguage(string language)
    {
        // Load base strings from embedded resource
        _defaults = LoadEmbeddedStrings(language) ?? LoadEmbeddedStrings("en") ?? new();
        _strings = new Dictionary<string, string>(_defaults);

        // Apply user overrides
        var overridesJson = _db.GetSetting($"ui_text_overrides_{language}");
        if (!string.IsNullOrEmpty(overridesJson))
        {
            var overrides = JsonSerializer.Deserialize<Dictionary<string, string>>(overridesJson);
            if (overrides is not null)
            {
                foreach (var (key, value) in overrides)
                    _strings[key] = value;
            }
        }
    }

    private static Dictionary<string, string>? LoadEmbeddedStrings(string language)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = $"LedgerDesk.Strings.{language}.json";

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream is null) return null;

        using var reader = new StreamReader(stream);
        var json = reader.ReadToEnd();
        return JsonSerializer.Deserialize<Dictionary<string, string>>(json);
    }

    public string Get(string key)
    {
        return _strings.TryGetValue(key, out var value) ? value : key;
    }

    public string Get(string key, params object[] args)
    {
        var template = Get(key);
        return string.Format(template, args);
    }

    public void SetOverride(string key, string value)
    {
        _strings[key] = value;
        SaveOverrides();
        LanguageChanged?.Invoke();
    }

    public void RemoveOverride(string key)
    {
        if (_defaults.TryGetValue(key, out var defaultVal))
            _strings[key] = defaultVal;
        else
            _strings.Remove(key);

        SaveOverrides();
        LanguageChanged?.Invoke();
    }

    public void ResetOverrides()
    {
        _strings = new Dictionary<string, string>(_defaults);
        _db.DeleteSetting($"ui_text_overrides_{_currentLanguage}");
        LanguageChanged?.Invoke();
    }

    private void SaveOverrides()
    {
        var overrides = new Dictionary<string, string>();
        foreach (var (key, value) in _strings)
        {
            if (!_defaults.TryGetValue(key, out var defaultVal) || defaultVal != value)
                overrides[key] = value;
        }

        if (overrides.Count > 0)
            _db.SetSetting($"ui_text_overrides_{_currentLanguage}",
                JsonSerializer.Serialize(overrides));
        else
            _db.DeleteSetting($"ui_text_overrides_{_currentLanguage}");
    }

    public Dictionary<string, string> GetAllStrings() => new(_strings);
    public Dictionary<string, string> GetDefaults() => new(_defaults);

    public static string[] SupportedLanguages => ["en", "zh-CN"];
    public static string GetLanguageDisplayName(string lang) => lang switch
    {
        "en" => "English",
        "zh-CN" => "中文（简体）",
        _ => lang,
    };
}
