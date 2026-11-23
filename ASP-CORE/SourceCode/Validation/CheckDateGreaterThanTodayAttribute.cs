using System.ComponentModel.DataAnnotations;

namespace _31241024603_NguyenThiKhanhNgoc.Validation;

public class CheckDateGreaterThanTodayAttribute : ValidationAttribute
{
    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        if (value is DateTime releaseDate && releaseDate >= DateTime.UtcNow)
        {
            return ValidationResult.Success;
        }

        return new ValidationResult(ErrorMessage ?? "Dữ liệu ngày phải lớn hơn ngày hôm nay");
    }
}