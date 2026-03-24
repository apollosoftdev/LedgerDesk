using System.Collections.ObjectModel;
using LedgerDesk.Models;
using LedgerDesk.Services;

namespace LedgerDesk.ViewModels;

public class DashboardViewModel : BaseViewModel
{
    private readonly DatabaseService _db;

    private ObservableCollection<Record> _records = [];
    private Record? _selectedRecord;
    private string _sidePanelMode = "None"; // None, Add, Edit
    private int _totalRecords;
    private string _totalIncome = "$0.00";
    private string _totalExpense = "$0.00";
    private string _balance = "$0.00";
    private string _statusText = "";
    private bool _hasRecords;

    public ObservableCollection<Record> Records
    {
        get => _records;
        set => SetProperty(ref _records, value);
    }

    public Record? SelectedRecord
    {
        get => _selectedRecord;
        set => SetProperty(ref _selectedRecord, value);
    }

    public string SidePanelMode
    {
        get => _sidePanelMode;
        set
        {
            if (SetProperty(ref _sidePanelMode, value))
                OnPropertyChanged(nameof(IsSidePanelOpen));
        }
    }

    public bool IsSidePanelOpen => SidePanelMode != "None";

    public int TotalRecords
    {
        get => _totalRecords;
        set => SetProperty(ref _totalRecords, value);
    }

    public string TotalIncome
    {
        get => _totalIncome;
        set => SetProperty(ref _totalIncome, value);
    }

    public string TotalExpense
    {
        get => _totalExpense;
        set => SetProperty(ref _totalExpense, value);
    }

    public string Balance
    {
        get => _balance;
        set => SetProperty(ref _balance, value);
    }

    public string StatusText
    {
        get => _statusText;
        set => SetProperty(ref _statusText, value);
    }

    public bool HasRecords
    {
        get => _hasRecords;
        set => SetProperty(ref _hasRecords, value);
    }

    // Commands
    public RelayCommand LoadRecordsCommand { get; }
    public RelayCommand NewRecordCommand { get; }

    // Categories for ComboBox binding
    private ObservableCollection<string> _categories = [];
    public ObservableCollection<string> Categories
    {
        get => _categories;
        set => SetProperty(ref _categories, value);
    }

    public DashboardViewModel(DatabaseService db)
    {
        _db = db;
        LoadRecordsCommand = new RelayCommand(LoadRecords);
        NewRecordCommand = new RelayCommand(() => SidePanelMode = "Add");
    }

    public void LoadRecords()
    {
        var records = _db.GetAllRecords();

        Records.Clear();
        foreach (var r in records)
            Records.Add(r);

        UpdateStats(records);
        LoadCategories();

        HasRecords = Records.Count > 0;
        StatusText = $"Showing {Records.Count} records";
    }

    private void UpdateStats(List<Record> records)
    {
        TotalRecords = records.Count;

        var income = records.Where(r => r.Amount > 0).Sum(r => r.Amount);
        var expense = records.Where(r => r.Amount < 0).Sum(r => Math.Abs(r.Amount));
        var balance = records.Sum(r => r.Amount);

        TotalIncome = $"${income:N2}";
        TotalExpense = $"${expense:N2}";
        Balance = $"${balance:N2}";
    }

    private void LoadCategories()
    {
        var cats = _db.GetAllCategories();
        Categories.Clear();
        foreach (var c in cats)
            Categories.Add(c.Name);
    }
}
