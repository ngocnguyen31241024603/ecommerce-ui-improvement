/* put your animation code here */
$(function () {
    const figure = $('figure');

    $('#btnFadeIn').click(function () {
        figure.fadeIn(1000);
    });

    $('#btnFadeOut').click(function () {
        figure.fadeOut(1000);
    });

    $('#btnFade').click(function () {
        figure.fadeToggle(500);
    });

    $('#btnSlideUp').click(function () {
        figure.slideUp('slow');
    });

    $('#btnSlideDown').click(function () {
        figure.slideDown('slow');
    });

    $('#btnSlide').click(function () {
        figure.slideToggle(2000);
    });
});
