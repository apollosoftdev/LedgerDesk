using Microsoft.UI.Composition.SystemBackdrops;
using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using LedgerDesk.Models;
using LedgerDesk.ViewModels;
using WinRT.Interop;

namespace LedgerDesk;

public sealed partial class MainWindow : Window
{
    public DashboardViewModel ViewModel { get; }
    private readonly MainViewModel _mainViewModel;

    public MainWindow()
    {
        ViewModel = new DashboardViewModel(App.Database);
        _mainViewModel = new MainViewModel();

        this.InitializeComponent();

        RootGrid.DataContext = ViewModel;

        SetWindowSize(1200, 780);
        SetupTitleBar();
        TrySetMicaBackdrop();

        ViewModel.LoadRecords();
    }

    // ============================
    //  Window / Title Bar / Mica
    // ============================

    private void SetWindowSize(int width, int height)
    {
        var hwnd = WindowNative.GetWindowHandle(this);
        var windowId = Microsoft.UI.Win32Interop.GetWindowIdFromWindow(hwnd);
        var appWindow = AppWindow.GetFromWindowId(windowId);
        appWindow.Resize(new Windows.Graphics.SizeInt32(width, height));
    }

    private void SetupTitleBar()
    {
        ExtendsContentIntoTitleBar = true;
        SetTitleBar(AppTitleBar);
    }

    private void TrySetMicaBackdrop()
    {
        if (MicaController.IsSupported())
        {
            this.SystemBackdrop = new MicaBackdrop { Kind = MicaKind.Base };
        }
        else if (DesktopAcrylicController.IsSupported())
        {
            this.SystemBackdrop = new DesktopAcrylicBackdrop();
        }
    }

    // ============================
    //  Navigation
    // ============================

    private void ShowPanel(string panel)
    {
        MainPanel.Visibility = panel == "Main" ? Visibility.Visible : Visibility.Collapsed;
        DetailPanel.Visibility = panel == "Detail" ? Visibility.Visible : Visibility.Collapsed;
        SettingsPanel.Visibility = panel == "Settings" ? Visibility.Visible : Visibility.Collapsed;

        _mainViewModel.NavigateTo(panel);
    }

    // ============================
    //  Event Handlers
    // ============================

    private void RefreshButton_Click(object sender, RoutedEventArgs e)
    {
        ViewModel.LoadRecords();
    }

    private void NewRecordButton_Click(object sender, RoutedEventArgs e)
    {
        // Phase 3: open side panel in Add mode
        ViewModel.SidePanelMode = "Add";
    }

    private void SettingsButton_Click(object sender, RoutedEventArgs e)
    {
        ShowPanel("Settings");
    }

    private void SearchBox_TextChanged(AutoSuggestBox sender, AutoSuggestBoxTextChangedEventArgs args)
    {
        if (args.Reason == AutoSuggestionBoxTextChangeReason.UserInput)
        {
            // Phase 4: full filter implementation
            // For now, simple title search
            var query = sender.Text?.Trim() ?? "";
            if (string.IsNullOrEmpty(query))
            {
                ViewModel.LoadRecords();
            }
            else
            {
                var filter = new RecordFilter { TitleQuery = query };
                var results = App.Database.SearchRecords(filter);
                ViewModel.Records.Clear();
                foreach (var r in results)
                    ViewModel.Records.Add(r);
                ViewModel.StatusText = $"Showing {ViewModel.Records.Count} records";
            }
        }
    }

    private void RecordListView_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (RecordListView.SelectedItem is Record selected)
        {
            ViewModel.SelectedRecord = selected;
            // Phase 3: navigate to full-page detail view
            // ShowPanel("Detail");
        }
    }
}
