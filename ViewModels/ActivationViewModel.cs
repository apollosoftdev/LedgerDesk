using LedgerDesk.Services;

namespace LedgerDesk.ViewModels;

public class ActivationViewModel : BaseViewModel
{
    private readonly LicenseService _licenseService;

    private string _macAddress = string.Empty;
    private string _licenseKey = string.Empty;
    private string _errorMessage = string.Empty;
    private bool _hasError;

    public string MacAddress
    {
        get => _macAddress;
        set => SetProperty(ref _macAddress, value);
    }

    public string LicenseKey
    {
        get => _licenseKey;
        set => SetProperty(ref _licenseKey, value);
    }

    public string ErrorMessage
    {
        get => _errorMessage;
        set
        {
            SetProperty(ref _errorMessage, value);
            HasError = !string.IsNullOrEmpty(value);
        }
    }

    public bool HasError
    {
        get => _hasError;
        set => SetProperty(ref _hasError, value);
    }

    public ActivationViewModel(LicenseService licenseService)
    {
        _licenseService = licenseService;
        MacAddress = _licenseService.GetMacAddress();
    }

    public bool TryActivate()
    {
        if (string.IsNullOrWhiteSpace(LicenseKey))
        {
            ErrorMessage = "Please enter a license key.";
            return false;
        }

        if (_licenseService.Activate(LicenseKey.Trim()))
        {
            ErrorMessage = string.Empty;
            return true;
        }

        ErrorMessage = "Invalid license key. Please check and try again.";
        return false;
    }
}
