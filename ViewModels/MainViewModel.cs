namespace LedgerDesk.ViewModels;

public class MainViewModel : BaseViewModel
{
    private string _currentView = "Main";

    public string CurrentView
    {
        get => _currentView;
        set => SetProperty(ref _currentView, value);
    }

    // Navigation commands
    public RelayCommand NavigateToMainCommand { get; }
    public RelayCommand NavigateToDetailCommand { get; }
    public RelayCommand NavigateToSettingsCommand { get; }

    public MainViewModel()
    {
        NavigateToMainCommand = new RelayCommand(() => CurrentView = "Main");
        NavigateToDetailCommand = new RelayCommand(() => CurrentView = "Detail");
        NavigateToSettingsCommand = new RelayCommand(() => CurrentView = "Settings");
    }

    public void NavigateTo(string view)
    {
        CurrentView = view;
    }
}
