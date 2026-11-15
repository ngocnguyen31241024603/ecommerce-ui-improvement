/* code goes here */
function setBackground(event) {
    if (event.type === "focus") {
        event.target.style.backgroundColor = "#FFE393";
    } else {
        event.target.style.backgroundColor = "white";
    }
}

window.addEventListener("load", function () {
    var fields = document.querySelectorAll('input[type="text"], input[type="password"]');

    for (var i = 0; i < fields.length; i++) {
        fields[i].addEventListener("focus", setBackground);
        fields[i].addEventListener("blur", setBackground);
    }
});
