function randomBetweenInterval(min, max) { // min and max included 
    return Math.random() * (max - min + 1) + min;
}

function getHaversineDistance(x1, y1, x2, y2, r) {
    var x_dif = x2 - x1;
    var y_dif = y2 - y1;
    var a = Math.pow(Math.sin(x_dif / 2), 2) + Math.cos(x1) * Math.cos(x2) * Math.pow(Math.sin(y_dif / 2), 2);
    var d = 2 * r * Math.asin(Math.sqrt(a));
    return d;
}