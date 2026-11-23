using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using _31241024603_NguyenThiKhanhNgoc.Data;
using _31241024603_NguyenThiKhanhNgoc.Models;
using _31241024603_NguyenThiKhanhNgoc.Extension;
using System.Text;
namespace _31241024603_NguyenThiKhanhNgoc.Controllers
{
    public class MoviesController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        private readonly IConfiguration _config;

        public MoviesController(
            ApplicationDbContext context,
            IWebHostEnvironment env,
            IConfiguration config)
        {
            _context = context;
            _env = env;
            _config = config;
        }

        private async Task<string> SaveImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return null;
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            if (!allowedExtensions.Contains(extension))
            {
                return null;
            }

            var folder = Path.Combine(_env.WebRootPath, "images");
            Directory.CreateDirectory(folder);

            var fileName = Guid.NewGuid().ToString("N") + extension;
            using var stream = System.IO.File.Create(Path.Combine(folder, fileName));
            await file.CopyToAsync(stream);

            return "/images/" + fileName;
        }
        public ActionResult AddToCart(int id)
        {
            var movie = _context.Movies.FirstOrDefault(item => item.ID == id);
            if (movie == null)
            {
                return RedirectToAction(nameof(Index));
            }

            var hoaDon = HttpContext.Session.Get<HoaDon>("HoaDon");
            var chiTiet = hoaDon.ChiTietHoaDons.FirstOrDefault(item => item.MaMovie == id);

            if (chiTiet == null)
            {
                hoaDon.ChiTietHoaDons.Add(new ChiTietHoaDon
                {
                    MaMovie = id,
                    MovieObj = movie,
                    SoLuong = 1
                });
            }
            else
            {
                chiTiet.SoLuong++;
            }

            hoaDon.TongTien = hoaDon.ChiTietHoaDons.Sum(item => item.SoLuong * item.MovieObj.Price);
            HttpContext.Session.Set<HoaDon>("HoaDon", hoaDon);

            return View(hoaDon);
        }
        public ActionResult RemoveFromCart(int maMovies)
        {
            var hoaDon = HttpContext.Session.Get<HoaDon>("HoaDon");
            var chiTiet = hoaDon.ChiTietHoaDons
                .FirstOrDefault(item => item.MaMovie == maMovies);

            if (chiTiet != null)
            {
                hoaDon.ChiTietHoaDons.Remove(chiTiet);
            }

            hoaDon.TongTien = hoaDon.ChiTietHoaDons.Sum(item => item.SoLuong * item.MovieObj.Price);
            HttpContext.Session.Set<HoaDon>("HoaDon", hoaDon);

            return View("AddToCart", hoaDon);
        }
        [HttpGet]
        public ActionResult Checkout()
        {
            return View(new ShippingDetail());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Checkout(
            [Bind("Name,Email,Address,Mobile")] ShippingDetail detail)
        {
            var hoaDon = HttpContext.Session.Get<HoaDon>("HoaDon");

            if (hoaDon.ChiTietHoaDons.Count == 0)
            {
                ModelState.AddModelError("", "Sorry, your cart is empty!");
            }

            if (!ModelState.IsValid)
            {
                return View(detail);
            }

            var order = new HoaDon
            {
                NgayLap = DateTime.Now,
                TongTien = hoaDon.TongTien
            };

            foreach (var ct in hoaDon.ChiTietHoaDons)
            {
                order.ChiTietHoaDons.Add(new ChiTietHoaDon
                {
                    MaMovie = ct.MaMovie,
                    SoLuong = ct.SoLuong
                });
            }

            _context.HoaDons.Add(order);
            _context.ShippingDetails.Add(detail);
            await _context.SaveChangesAsync();

            HttpContext.Session.Remove("HoaDon");

            var gmail = _config["Email:Address"];
            var appPassword = _config["Email:AppPassword"];

            if (!string.IsNullOrWhiteSpace(gmail) &&
                !string.IsNullOrWhiteSpace(appPassword))
            {
                Func<string, string> encode = System.Net.WebUtility.HtmlEncode;
                var body = new StringBuilder()
                    .AppendLine("<p>A new order has been submitted</p><hr />")
                    .AppendLine("<p>Items:</p><ul>");

                foreach (var ct in hoaDon.ChiTietHoaDons)
                {
                    var subtotal = ct.MovieObj.Price * ct.SoLuong;
                    body.AppendLine(
                        $"<li>{ct.SoLuong} x {encode(ct.MovieObj.Title)} (subtotal: {subtotal:N0})</li>");
                }

                body.AppendLine("</ul>")
                    .AppendLine($"<p>Total order value: {hoaDon.TongTien:N0}</p><hr />")
                    .AppendLine(
                        $"<p>Ship to:<br/>{encode(detail.Name)}<br/>{encode(detail.Address)}<br/>{encode(detail.Mobile)}</p>");

                await EmailServiceNew.SendMailGoogleSmtp(
                    gmail, detail.Email, "New order submitted!",
                    body.ToString(), gmail, appPassword);
            }

            return View("CheckoutCompleted");
        }
        // GET: Movies
        public async Task<IActionResult> Index()
        {
            var applicationDbContext = _context.Movies.Include(m => m.GenreObj);
            return View(await applicationDbContext.ToListAsync());
        }

        // GET: Movies/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var movie = await _context.Movies
                .Include(m => m.GenreObj)
                .FirstOrDefaultAsync(m => m.ID == id);
            if (movie == null)
            {
                return NotFound();
            }

            return View(movie);
        }

        // GET: Movies/Create
        public IActionResult Create()
        {
            ViewData["GenreID"] = new SelectList(_context.Genres, "ID", "Name");
            return View();
        }
        // POST: Movies/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Movie movie)
        {
            if (ModelState.IsValid)
            {
                movie.PicturePath = await SaveImageAsync(movie.PictureUpload)
                    ?? "/images/no-image.jpg";

                _context.Add(movie);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }

            ViewData["GenreID"] = new SelectList(_context.Genres, "ID", "Name", movie.GenreID);
            return View(movie);
        }

        // GET: Movies/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var movie = await _context.Movies.FindAsync(id);
            if (movie == null)
            {
                return NotFound();
            }

            ViewData["GenreID"] = new SelectList(_context.Genres, "ID", "Name", movie.GenreID);
            return View(movie);
        }

        // POST: Movies/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Movie movie)
        {
            if (id != movie.ID)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    var newPath = await SaveImageAsync(movie.PictureUpload);

                    if (newPath != null)
                    {
                        movie.PicturePath = newPath;
                    }
                    else if (string.IsNullOrEmpty(movie.PicturePath))
                    {
                        movie.PicturePath = "/images/no-image.jpg";
                    }

                    _context.Update(movie);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!MovieExists(movie.ID))
                    {
                        return NotFound();
                    }

                    throw;
                }

                return RedirectToAction(nameof(Index));
            }

            ViewData["GenreID"] = new SelectList(_context.Genres, "ID", "Name", movie.GenreID);
            return View(movie);
        }

        // GET: Movies/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var movie = await _context.Movies
                .Include(m => m.GenreObj)
                .FirstOrDefaultAsync(m => m.ID == id);
            if (movie == null)
            {
                return NotFound();
            }

            return View(movie);
        }

        // POST: Movies/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var movie = await _context.Movies.FindAsync(id);
            if (movie != null)
            {
                _context.Movies.Remove(movie);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool MovieExists(int id)
        {
            return _context.Movies.Any(e => e.ID == id);
        }
    }
}
