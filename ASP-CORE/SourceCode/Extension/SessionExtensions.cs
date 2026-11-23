using Newtonsoft.Json;

namespace _31241024603_NguyenThiKhanhNgoc.Extension;

public static class SessionExtensions
{
    public static void Set<T>(this ISession session, string key, T value)
    {
        var settings = new JsonSerializerSettings
        {
            ReferenceLoopHandling = ReferenceLoopHandling.Ignore
        };

        session.SetString(
            key,
            JsonConvert.SerializeObject(value, Formatting.Indented, settings));
    }

    public static T Get<T>(this ISession session, string key)
    {
        var value = session.GetString(key);

        return value == null
            ? Activator.CreateInstance<T>()
            : JsonConvert.DeserializeObject<T>(value);
    }
}