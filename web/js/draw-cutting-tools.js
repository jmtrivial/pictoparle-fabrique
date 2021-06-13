
class DrawCuttingTools {
    constructor() {        
    }


}

DrawCuttingTools.scale = function(pl, scale) {
    return pl.map(p => [p[0] * scale, p[1] * scale]);
}

DrawCuttingTools.invertXY = function(pl) {
    return pl.map(p => [p[1], p[0]]);
}

DrawCuttingTools.pathShift = function(pl, x, y) {
    return pl.map(p => [p[0] + x, p[1] + y]);
}

DrawCuttingTools.multipathShift = function(ppl, x, y) {
    return ppl.map(pl => pl.map(p => [p[0] + x, p[1] + y]));
}

DrawCuttingTools.pathInvertX = function(pl) {
    return pl.map(p => [-p[0], p[1]]);
}

DrawCuttingTools.pathInvertY = function(pl) {
    return pl.map(p => [p[0], -p[1]]);
}

DrawCuttingTools.pathSymmetryX = function(pl, axis) {
    var result = pl.map(p => [axis + (axis - p[0]), p[1]]);
    result.reverse();
    return result;
}


DrawCuttingTools.multipathSymmetryX = function(ppl, axis) {
    var result = ppl.map(pl => DrawCuttingTools.pathSymmetryX(pl, axis));
    return result;
}

DrawCuttingTools.pathSymmetryY = function(pl, axis) {
    var result = pl.map(p => [p[0], axis + (axis - p[1])]);
    result.reverse();
    return result;
}

DrawCuttingTools.pathSymmetryXMiddle = function(pl) {
    var box = Box.getBoundingBox(pl);
    return DrawCuttingTools.pathSymmetryX(pl, box.center()[0]);
}

DrawCuttingTools.multipathSymmetryXMiddle = function(ppl, x, y) {
    var box = Box.getBoundingBox(ppl);
    return DrawCuttingTools.multipathSymmetryX(ppl, box.center()[0]);
}


DrawCuttingTools.pathAbsoluteToRelative = function(pl) {
    var x = pl[0][0];
    var y = pl[0][1];
    var result = [];

    for(var i = 1; i < pl.length; ++i) {
        result.push([pl[i][0] - x, pl[i][1] - y]);
        x = pl[i][0];
        y = pl[i][1];
    }

    return result;

}