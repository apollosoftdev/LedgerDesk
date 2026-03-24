namespace LedgerDesk.Models;

public class RecordFilter
{
    public string? TitleQuery { get; set; }
    public string? CategoryFilter { get; set; }
    public string? DescriptionQuery { get; set; }
    public decimal? AmountMin { get; set; }
    public decimal? AmountMax { get; set; }
    public DateTime? DateStart { get; set; }
    public DateTime? DateEnd { get; set; }

    public bool IsEmpty =>
        string.IsNullOrWhiteSpace(TitleQuery) &&
        string.IsNullOrWhiteSpace(CategoryFilter) &&
        string.IsNullOrWhiteSpace(DescriptionQuery) &&
        AmountMin is null &&
        AmountMax is null &&
        DateStart is null &&
        DateEnd is null;
}
