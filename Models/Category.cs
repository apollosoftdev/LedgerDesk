using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace LedgerDesk.Models;

public class Category : INotifyPropertyChanged
{
    private int _id;
    private string _name = string.Empty;
    private int _sortOrder;

    public int Id
    {
        get => _id;
        set { _id = value; OnPropertyChanged(); }
    }

    public string Name
    {
        get => _name;
        set { _name = value; OnPropertyChanged(); }
    }

    public int SortOrder
    {
        get => _sortOrder;
        set { _sortOrder = value; OnPropertyChanged(); }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
