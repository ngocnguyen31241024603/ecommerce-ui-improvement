using System.Net;
using System.Net.Mail;
using System.Text;

namespace _31241024603_NguyenThiKhanhNgoc.Extension;

public class EmailServiceNew
{
    public static async Task<bool> SendMailGoogleSmtp(
        string _from, string _to, string _subject, string _body,
        string _gmailsend, string _gmailpassword)
    {
        using var client = new SmtpClient("smtp.gmail.com")
        {
            Port = 587,
            Credentials = new NetworkCredential(_gmailsend, _gmailpassword),
            EnableSsl = true
        };

        return await SendMail(_from, _to, _subject, _body, client);
    }

    public static async Task<bool> SendMail(
        string _from, string _to, string _subject, string _body,
        SmtpClient client)
    {
        using var message = new MailMessage(_from, _to, _subject, _body)
        {
            BodyEncoding = Encoding.UTF8,
            SubjectEncoding = Encoding.UTF8,
            IsBodyHtml = true
        };

        message.ReplyToList.Add(new MailAddress(_from));
        message.Sender = new MailAddress(_from);

        try
        {
            await client.SendMailAsync(message);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
            return false;
        }
    }
}