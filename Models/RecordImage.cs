using System.ComponentModel;
using System.Runtime.CompilerServices;
using Microsoft.UI.Xaml.Media.Imaging;

namespace LedgerDesk.Models;

public class RecordImage : INotifyPropertyChanged
{
    private int _id;
    private int _recordId;
    private byte[] _imageData = [];
    private int _sortOrder;

    public int Id
    {
        get => _id;
        set { _id = value; OnPropertyChanged(); }
    }

    public int RecordId
    {
        get => _recordId;
        set { _recordId = value; OnPropertyChanged(); }
    }

    public byte[] ImageData
    {
        get => _imageData;
        set { _imageData = value; OnPropertyChanged(); OnPropertyChanged(nameof(ImageSource)); }
    }

    public int SortOrder
    {
        get => _sortOrder;
        set { _sortOrder = value; OnPropertyChanged(); }
    }

    public BitmapImage? ImageSource
    {
        get
        {
            if (_imageData is not { Length: > 0 }) return null;
            var bmp = new BitmapImage();
            using var stream = new System.IO.MemoryStream(_imageData);
            bmp.SetSource(stream.AsRandomAccessStream());
            return bmp;
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
