using System.Collections.ObjectModel;
using LedgerDesk.Models;
using LedgerDesk.Services;

namespace LedgerDesk.ViewModels;

public class RecordDetailViewModel : BaseViewModel
{
    private readonly DatabaseService _db;

    private Record? _record;
    private ObservableCollection<RecordImage> _images = [];

    public Record? Record
    {
        get => _record;
        set => SetProperty(ref _record, value);
    }

    public ObservableCollection<RecordImage> Images
    {
        get => _images;
        set => SetProperty(ref _images, value);
    }

    public bool HasImages => Images.Count > 0;

    public RecordDetailViewModel(DatabaseService db)
    {
        _db = db;
    }

    public void LoadRecord(int recordId)
    {
        Record = _db.GetRecordById(recordId);

        Images.Clear();
        if (Record is not null)
        {
            var images = _db.GetImagesForRecord(recordId);
            foreach (var img in images)
                Images.Add(img);
        }

        OnPropertyChanged(nameof(HasImages));
    }

    public void DeleteRecord()
    {
        if (Record is null) return;
        _db.DeleteRecord(Record.Id);
        Record = null;
        Images.Clear();
        OnPropertyChanged(nameof(HasImages));
    }
}
