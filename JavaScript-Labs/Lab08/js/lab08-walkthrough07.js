
/* add code here */ var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

days.push("Saturday");
days.unshift("Sunday");

document.write("<table><tr>");

for (var i = 0; i < days.length; i++) {
    var dayName = days[i];

    if (dayName === "Tuesday" || dayName === "Thursday") {
        dayName = "<em>" + dayName + "</em>";
    }

    document.write("<th>" + dayName + "</th>");
}

document.write("</tr>");

for (var weekStart = 1; weekStart <= 30; weekStart += days.length) {
    document.write("<tr>");

    for (var column = 0; column < days.length; column++) {
        var date = weekStart + column;
        document.write("<td>" + (date <= 30 ? date : "") + "</td>");
    }

    document.write("</tr>");
}

document.write("</table>");

