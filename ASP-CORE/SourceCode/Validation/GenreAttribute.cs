using System.ComponentModel.DataAnnotations;
using _31241024603_NguyenThiKhanhNgoc.Data;

namespace _31241024603_NguyenThiKhanhNgoc.Validation;

public class GenreAttribute : ValidationAttribute
{
    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        if (!int.TryParse(value?.ToString(), out int genreId))
        {
            return new ValidationResult(ErrorMessage ?? "Genre không hợp lệ");
        }

        var context = (ApplicationDbContext)validationContext
            .GetService(typeof(ApplicationDbContext));

        if (context.Genres.Any(genre => genre.ID == genreId))
        {
            return ValidationResult.Success;
        }

        return new ValidationResult(ErrorMessage ?? "Genre không tồn tại");
    }
}