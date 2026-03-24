using Microsoft.UI;
using Microsoft.UI.Xaml.Data;
using Microsoft.UI.Xaml.Media;

namespace LedgerDesk.Helpers;

public class AmountToColorConverter : IValueConverter
{
    private static readonly SolidColorBrush PositiveBrush = new(ColorHelper.FromArgb(255, 16, 185, 129));  // green
    private static readonly SolidColorBrush NegativeBrush = new(ColorHelper.FromArgb(255, 239, 68, 68));   // red
    private static readonly SolidColorBrush NeutralBrush = new(Colors.Gray);

    public object Convert(object value, Type targetType, object parameter, string language)
    {
        if (value is decimal amount)
        {
            return amount switch
            {
                > 0 => PositiveBrush,
                < 0 => NegativeBrush,
                _ => NeutralBrush,
            };
        }
        return NeutralBrush;
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language)
        => throw new NotSupportedException();
}
