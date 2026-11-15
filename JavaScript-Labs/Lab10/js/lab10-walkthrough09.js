$(function () {
    $("#consume").on("click", function () {
        var url = "http://randyconnolly.com/funwebdev/services/travel/cities.php";

        $.get(url, function (cities, status) {
            if (status === "success") {
                var list = $("<ul>");

                $.each(cities, function (index, city) {
                    $("<li>").text(city.name).appendTo(list);
                });

                $("#results").empty().append(list);
            }
        }, "json");
    });
});