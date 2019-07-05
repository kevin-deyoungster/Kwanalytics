/*
This modules contains utility functions to help with functioning of the system
*/

function pad(n, width, c) {
    c = c || "0";
    n = n + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(c) + n;
}

function formatTime(time) {
    d = Number(time);

    var h = Math.floor(d / 3600);
    var m = Math.floor((d % 3600) / 60);
    var s = Math.floor((d % 3600) % 60);

    var hDisplay = pad(h, 2);
    var mDisplay = pad(m, 2);
    var sDisplay = pad(s, 2);

    return `${hDisplay}:${mDisplay}:${sDisplay}`;
}

function setStatus(text) {
    STATUS.innerHTML = text;
}

function getDate() {
    var currentDate = new Date();

    var date = currentDate.getDate();
    var month = currentDate.getMonth(); //Be careful! January is 0 not 1
    var year = currentDate.getFullYear();

    var dateString = date + "-" + (month + 1) + "-" + year;
    return dateString;
}

function haversine_distance(lat1, lon1, lat2, lon2) {
    var R = 6371; // km (change this constant to get miles)
    var dLat = ((lat2 - lat1) * Math.PI) / 180;
    var dLon = ((lon2 - lon1) * Math.PI) / 180;
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return parseFloat(d).toFixed(2) + " km";
}
