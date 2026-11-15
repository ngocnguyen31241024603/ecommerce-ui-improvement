/* code goes here */
var button = document.getElementById("testButton");
var image = document.getElementById("mainImage");
var content = document.getElementById("content");
var transitionTimer;

button.addEventListener("click", function () {
    clearTimeout(transitionTimer);

    if (button.textContent === "Hide") {
        button.textContent = "Show";
        content.className = "makeItDisappear";

        transitionTimer = setTimeout(function () {
            content.style.display = "none";
        }, 1000);
    } else {
        button.textContent = "Hide";
        content.style.display = "block";

        transitionTimer = setTimeout(function () {
            content.className = "makeItNormal";
        }, 500);
    }
});

image.addEventListener("mouseover", function () {
    image.className = "makeItGray";
});

image.addEventListener("mouseout", function () {
    image.className = "makeItNormal";
});
