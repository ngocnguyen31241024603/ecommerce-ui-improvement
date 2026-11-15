/* code goes here */
var msg = document.getElementById("msgArea");
msg.value = "here is some text";

document.getElementById("pageTitle").innerHTML = "Even newer title";
var first = document.getElementById("first");

console.log("innerHTML", first.innerHTML);
console.log("innerText", first.innerText);
console.log("Class của ô văn bản", msg.getAttribute("class"));

var textareas = document.getElementsByTagName("textarea");
textareas[0].value = "selected by tag name";

var spans = document.getElementsByTagName("span");
for (var i = 0; i < spans.length; i++) {
    msg.value += "\n" + spans[i].innerText;
}
console.log("Chọn theo thẻ", msg.value);

var counts = document.getElementsByClassName("count-number");
msg.value = "";
for (var i = 0; i < counts.length; i++) {
    msg.value += counts[i].innerText + "\n";
}
console.log("Chọn theo class", msg.value);

var firstParagraph = document.querySelector("#first p");
console.log("Đoạn đầu tiên", firstParagraph.innerHTML);

var paragraphs = document.querySelectorAll("#first p");
msg.value = "";
for (var i = 0; i < paragraphs.length; i++) {
    msg.value += paragraphs[i].innerHTML + "\n";
}
msg.setAttribute("class", "hidden");
document.getElementById("features").style.backgroundColor = "green";