$(function () {
    var loading = $(".animLoading").hide();

    $("#consume").on("click", function () {
        loading.show();

        $.get({
            url: "http://randyconnolly.com/funwebdev/services/travel/cities.php",
            dataType: "json"
        })
            .done(function (cities) {
                var list = $("<ul>");

                $.each(cities, function (index, city) {
                    $("<li>").text(city.name).appendTo(list);
                });

                $("#results").empty().append(list);
            })
            .fail(function (xhr, status) {
                alert("Failed loading data. Status: " + status);
            })
            .always(function () {
                loading.fadeOut("slow");
            });
    });
});