/* code goes here */
function checkForEmptyFields(event) {
    var errorArea = document.getElementById("errors");
    errorArea.className = "hidden";

    var fields = event.currentTarget.querySelectorAll(
        'input[type="text"], input[type="password"]'
    );
    var emptyFields = [];

    for (var i = 0; i < fields.length; i++) {
        if (fields[i].value.trim() === "") {
            emptyFields.push(fields[i].id);
        }
    }

    if (emptyFields.length > 0) {
        event.preventDefault();

        var message = document.createElement("p");
        message.textContent = "The following fields can't be empty: " + emptyFields.join(", ");
        errorArea.replaceChildren(message);
        errorArea.className = "visible";
    }
}

window.addEventListener("load", function () {
    var form = document.getElementById("sampleForm");
    document.getElementById("errors").className = "hidden";
    form.addEventListener("submit", checkForEmptyFields);
});
