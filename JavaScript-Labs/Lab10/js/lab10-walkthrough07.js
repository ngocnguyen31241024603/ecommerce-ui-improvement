/* put your animation code here */
$(function () {
    function movePreview(event) {
        $("#preview").css({
            top: (event.pageY - 10) + "px",
            left: (event.pageX + 30) + "px"
        });
    }

    $("figure img")
        .on("mouseover", function (event) {
            var thumbnail = $(this);
            var caption = thumbnail.attr("alt");
            var imageSrc = thumbnail.attr("src").replace("/small/", "/medium/");

            var preview = $('<div id="preview"></div>').hide();
            preview.append($("<img>").attr({ src: imageSrc, alt: caption }));
            preview.append($("<p>").text(caption));
            $("body").append(preview);

            thumbnail.addClass("gray");
            movePreview(event);
            preview.fadeIn(1000);
        })
        .on("mousemove", movePreview)
        .on("mouseleave", function () {
            $(this).removeClass("gray");
            $("#preview").remove();
        });
});
