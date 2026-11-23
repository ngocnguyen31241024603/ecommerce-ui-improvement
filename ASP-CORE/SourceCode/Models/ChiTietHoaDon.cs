using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace _31241024603_NguyenThiKhanhNgoc.Models;

public class ChiTietHoaDon
{
    [Key]
    public int MaChiTietHoaDon { get; set; }

    [ForeignKey(nameof(HoaDonObj))]
    public int MaHoaDon { get; set; }
    public virtual HoaDon HoaDonObj { get; set; }

    [ForeignKey(nameof(MovieObj))]
    public int MaMovie { get; set; }
    public virtual Movie MovieObj { get; set; }

    public int SoLuong { get; set; }
}