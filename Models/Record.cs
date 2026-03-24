using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace LedgerDesk.Models;

public class Record : INotifyPropertyChanged
{
    private int _id;
    private string _title = string.Empty;
    private string _category = string.Empty;
    private string _description = string.Empty;
    private decimal _amount;
    private DateTime _date = DateTime.Today;
    private DateTime _createdAt;
    private DateTime _updatedAt;
    private bool _hasImages;

    public int Id
    {
        get => _id;
        set { _id = value; OnPropertyChanged(); }
    }

    public string Title
    {
        get => _title;
        set { _title = value; OnPropertyChanged(); }
    }

    public string Category
    {
        get => _category;
        set { _category = value; OnPropertyChanged(); }
    }

    public string Description
    {
        get => _description;
        set { _description = value; OnPropertyChanged(); }
    }

    public decimal Amount
    {
        get => _amount;
        set { _amount = value; OnPropertyChanged(); OnPropertyChanged(nameof(AmountDisplay)); }
    }

    public DateTime Date
    {
        get => _date;
        set { _date = value; OnPropertyChanged(); OnPropertyChanged(nameof(DateDisplay)); }
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set { _createdAt = value; OnPropertyChanged(); }
    }

    public DateTime UpdatedAt
    {
        get => _updatedAt;
        set { _updatedAt = value; OnPropertyChanged(); }
    }

    public bool HasImages
    {
        get => _hasImages;
        set { _hasImages = value; OnPropertyChanged(); }
    }

    // Computed display properties
    public string AmountDisplay => Amount >= 0 ? $"+${Amount:N2}" : $"-${Math.Abs(Amount):N2}";
    public string DateDisplay => Date.ToString("yyyy-MM-dd");

    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
