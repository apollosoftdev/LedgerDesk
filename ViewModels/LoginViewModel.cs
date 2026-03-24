using LedgerDesk.Services;

namespace LedgerDesk.ViewModels;

public class LoginViewModel : BaseViewModel
{
    private readonly AuthService _authService;

    private string _password = string.Empty;
    private string _confirmPassword = string.Empty;
    private string _errorMessage = string.Empty;
    private bool _hasError;
    private bool _isFirstRun;

    public string Password
    {
        get => _password;
        set => SetProperty(ref _password, value);
    }

    public string ConfirmPassword
    {
        get => _confirmPassword;
        set => SetProperty(ref _confirmPassword, value);
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

    public bool IsFirstRun
    {
        get => _isFirstRun;
        set => SetProperty(ref _isFirstRun, value);
    }

    public LoginViewModel(AuthService authService)
    {
        _authService = authService;
        IsFirstRun = !_authService.IsPasswordSet();
    }

    public bool TryLogin()
    {
        if (string.IsNullOrEmpty(Password))
        {
            ErrorMessage = "Please enter a password.";
            return false;
        }

        if (IsFirstRun)
        {
            if (Password.Length < 4)
            {
                ErrorMessage = "Password must be at least 4 characters.";
                return false;
            }

            if (Password != ConfirmPassword)
            {
                ErrorMessage = "Passwords do not match.";
                return false;
            }

            _authService.SetPassword(Password);
            ErrorMessage = string.Empty;
            return true;
        }

        if (_authService.VerifyPassword(Password))
        {
            ErrorMessage = string.Empty;
            return true;
        }

        ErrorMessage = "Incorrect password.";
        return false;
    }
}
