using Microsoft.UI.Composition.SystemBackdrops;
using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Media.Imaging;
using LedgerDesk.Models;
using LedgerDesk.ViewModels;
using Windows.ApplicationModel.DataTransfer;
using Windows.Storage;
using Windows.Storage.Pickers;
using WinRT.Interop;

namespace LedgerDesk;

public sealed partial class MainWindow : Window
{
    public DashboardViewModel ViewModel { get; }
    private readonly MainViewModel _mainViewModel;
    private readonly RecordFormViewModel _formViewModel;
    private readonly RecordDetailViewModel _detailViewModel;

    public MainWindow()
    {
        ViewModel = new DashboardViewModel(App.Database);
        _mainViewModel = new MainViewModel();
        _formViewModel = new RecordFormViewModel(App.Database);
        _detailViewModel = new RecordDetailViewModel(App.Database);

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
            this.SystemBackdrop = new MicaBackdrop { Kind = MicaKind.Base };
        else if (DesktopAcrylicController.IsSupported())
            this.SystemBackdrop = new DesktopAcrylicBackdrop();
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
    //  Side Panel (Add/Edit)
    // ============================

    private void OpenSidePanel()
    {
        SidePanelColumn.Width = new GridLength(360);
        SidePanel.Visibility = Visibility.Visible;
        SidePanelHeader.Text = _formViewModel.HeaderText;

        // Populate category ComboBox
        FormCategory.Items.Clear();
        foreach (var cat in ViewModel.Categories)
            FormCategory.Items.Add(cat);

        // Bind form fields
        FormTitle.Text = _formViewModel.Title;
        FormCategory.Text = _formViewModel.Category;
        FormAmount.Value = _formViewModel.Amount;
        FormDate.Date = _formViewModel.Date;
        FormDescription.Text = _formViewModel.Description;

        UpdateFormImageDisplay();
    }

    private void CloseSidePanel()
    {
        SidePanelColumn.Width = new GridLength(0);
        SidePanel.Visibility = Visibility.Collapsed;
        ViewModel.SidePanelMode = "None";
    }

    private void CloseSidePanel_Click(object sender, RoutedEventArgs e) => CloseSidePanel();

    // ============================
    //  Header Button Handlers
    // ============================

    private void RefreshButton_Click(object sender, RoutedEventArgs e)
    {
        ViewModel.LoadRecords();
    }

    private void NewRecordButton_Click(object sender, RoutedEventArgs e)
    {
        _formViewModel.ResetForAdd();
        ViewModel.SidePanelMode = "Add";
        RecordListView.SelectedItem = null;
        OpenSidePanel();
    }

    private void SettingsButton_Click(object sender, RoutedEventArgs e)
    {
        CloseSidePanel();
        ShowPanel("Settings");
    }

    // ============================
    //  Search (basic, Phase 4 expands)
    // ============================

    private void SearchBox_TextChanged(AutoSuggestBox sender, AutoSuggestBoxTextChangedEventArgs args)
    {
        if (args.Reason != AutoSuggestionBoxTextChangeReason.UserInput) return;

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
            ViewModel.HasRecords = ViewModel.Records.Count > 0;
            ViewModel.StatusText = $"Showing {ViewModel.Records.Count} records";
        }
    }

    // ============================
    //  Record List Selection → Detail
    // ============================

    private void RecordListView_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (RecordListView.SelectedItem is Record selected)
        {
            ViewModel.SelectedRecord = selected;
            NavigateToDetail(selected.Id);
        }
    }

    private void NavigateToDetail(int recordId)
    {
        _detailViewModel.LoadRecord(recordId);
        var record = _detailViewModel.Record;
        if (record is null) return;

        // Populate detail UI
        DetailTitle.Text = record.Title;
        DetailCategory.Text = record.Category;
        DetailDate.Text = record.DateDisplay;
        DetailAmount.Text = record.AmountDisplay;

        // Color the amount
        DetailAmount.Foreground = record.Amount switch
        {
            > 0 => new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 16, 185, 129)),
            < 0 => new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 239, 68, 68)),
            _ => new SolidColorBrush(Microsoft.UI.Colors.Gray),
        };

        // Description
        if (string.IsNullOrWhiteSpace(record.Description))
        {
            DetailDescriptionSection.Visibility = Visibility.Collapsed;
        }
        else
        {
            DetailDescriptionSection.Visibility = Visibility.Visible;
            DetailDescription.Text = record.Description;
        }

        // Images
        if (_detailViewModel.HasImages)
        {
            DetailImageSection.Visibility = Visibility.Visible;
            DetailImageGallery.ItemsSource = _detailViewModel.Images;
        }
        else
        {
            DetailImageSection.Visibility = Visibility.Collapsed;
        }

        CloseSidePanel();
        ShowPanel("Detail");
    }

    // ============================
    //  Detail Actions
    // ============================

    private void DetailBack_Click(object sender, RoutedEventArgs e)
    {
        RecordListView.SelectedItem = null;
        ShowPanel("Main");
    }

    private void DetailEdit_Click(object sender, RoutedEventArgs e)
    {
        if (_detailViewModel.Record is null) return;

        _formViewModel.LoadForEdit(_detailViewModel.Record);
        ViewModel.SidePanelMode = "Edit";
        ShowPanel("Main");
        OpenSidePanel();
    }

    private async void DetailDelete_Click(object sender, RoutedEventArgs e)
    {
        if (_detailViewModel.Record is null) return;

        var dialog = new ContentDialog
        {
            Title = "Delete Record",
            Content = $"Are you sure you want to delete \"{_detailViewModel.Record.Title}\"?\nThis action cannot be undone.",
            PrimaryButtonText = "Delete",
            CloseButtonText = "Cancel",
            DefaultButton = ContentDialogButton.Close,
            XamlRoot = this.Content.XamlRoot,
        };

        if (await dialog.ShowAsync() == ContentDialogResult.Primary)
        {
            _detailViewModel.DeleteRecord();
            ViewModel.LoadRecords();
            ShowPanel("Main");
        }
    }

    // ============================
    //  Save Record (Add / Edit)
    // ============================

    private void SaveRecord_Click(object sender, RoutedEventArgs e)
    {
        // Read form values into ViewModel
        _formViewModel.Title = FormTitle.Text?.Trim() ?? "";
        _formViewModel.Category = FormCategory.Text?.Trim() ?? "";
        _formViewModel.Description = FormDescription.Text?.Trim() ?? "";
        _formViewModel.Amount = double.IsNaN(FormAmount.Value) ? 0 : FormAmount.Value;
        _formViewModel.Date = FormDate.Date ?? DateTimeOffset.Now;

        if (!_formViewModel.Validate())
        {
            // Simple validation feedback
            if (string.IsNullOrWhiteSpace(_formViewModel.Title))
                FormTitle.Focus(FocusState.Programmatic);
            else if (string.IsNullOrWhiteSpace(_formViewModel.Category))
                FormCategory.Focus(FocusState.Programmatic);
            return;
        }

        _formViewModel.Save();
        CloseSidePanel();
        ViewModel.LoadRecords();
    }

    // ============================
    //  Image Handling
    // ============================

    private static readonly string[] _imageExtensions = [".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"];

    private async void BrowseImage_Click(object sender, RoutedEventArgs e)
    {
        var picker = new FileOpenPicker();
        InitializeWithWindow.Initialize(picker, WindowNative.GetWindowHandle(this));
        foreach (var ext in _imageExtensions)
            picker.FileTypeFilter.Add(ext);

        var files = await picker.PickMultipleFilesAsync();
        if (files is null) return;

        foreach (var file in files)
            await AddImageFromFile(file);
    }

    private void FormImageDropZone_DragOver(object sender, DragEventArgs e)
    {
        e.AcceptedOperation = DataPackageOperation.Copy;
        e.DragUIOverride.Caption = "Add image(s)";
    }

    private async void FormImageDropZone_Drop(object sender, DragEventArgs e)
    {
        if (!e.DataView.Contains(StandardDataFormats.StorageItems)) return;

        var items = await e.DataView.GetStorageItemsAsync();
        var imageFiles = items.OfType<StorageFile>()
            .Where(f => _imageExtensions.Contains(Path.GetExtension(f.Name).ToLowerInvariant()));

        foreach (var file in imageFiles)
            await AddImageFromFile(file);
    }

    private async Task AddImageFromFile(StorageFile file)
    {
        using var stream = await file.OpenStreamForReadAsync();
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);
        var bytes = ms.ToArray();

        _formViewModel.AddImage(bytes);
        UpdateFormImageDisplay();
    }

    private void RemoveImage_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is PendingImage img)
        {
            _formViewModel.RemoveImage(img);
            UpdateFormImageDisplay();
        }
    }

    private void UpdateFormImageDisplay()
    {
        var hasImages = _formViewModel.PendingImages.Count > 0;
        FormImageList.ItemsSource = _formViewModel.PendingImages;
        FormImageList.Visibility = hasImages ? Visibility.Visible : Visibility.Collapsed;
        FormImagePlaceholder.Visibility = hasImages ? Visibility.Collapsed : Visibility.Visible;
    }
}
