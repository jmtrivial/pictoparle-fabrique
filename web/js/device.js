function distance(p1, p2) {
    return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]));
}

// return a number in the given list that is only once
function singleValue(data) {
    var res = data.filter(function(v) {
        // get the count of the current element in array
        // and filter based on the count
        return data.filter(function(v1) {
          // compare with current element
          return v1 == v;
          // check length
        }).length == 1;
    });
    // if all values are the same, return this one
    if (res.length == 0)
        return data[0];
    return res[0];
}

function fourthPoint(p, p1, p2) {
    return [ singleValue([p[0], p1[0], p2[0]]), singleValue([p[1], p1[1], p2[1]])];
}

class Device {
    
    constructor(name, id, screen, margins, thickness, camera, windows) {
        this.name = name;
        this.id = id;
        this.screen = screen;
        this.margins = margins;
        this.thickness = thickness;
        this.camera = camera;
        this.windows = windows;

        this.debug = false;

    }

    getWidth() {
        return this.screen["width"] + this.margins["left"] + this.margins["right"];
    }
    getHeight() {
        return this.screen["height"] + this.margins["top"] + this.margins["bottom"];
    }

    getScreenWidth() {
        return this.screen["width"];
    }
    getScreenHeight() {
        return this.screen["height"];
    }

}

Device.fromXML = function(xmldoc) {
    var xml;
    if (typeof xmldoc ===  'string' || xmldoc instanceof String) {
        xml = $.parseXML(xmldoc);
    }
    else {
        xml = xmldoc;
    }

    var xmldevice = xml.getElementsByTagName("device")[0];
    var xmlscreen = xml.getElementsByTagName("screen")[0];
    var xmlboard = xml.getElementsByTagName("board")[0];
    var xmlcamera = xml.getElementsByTagName("camera")[0];
    var xmlwindows = xml.getElementsByTagName("windows")[0];

    var name = xmldevice.getAttribute("name");
    var id = xmldevice.getAttribute("id");

    var screen = {};
    for (var e of ["width", "height"]) {
        screen[e] = parseFloat(xmlscreen.getAttribute(e));
    }

    var margins = {};
    for (var e of ["left", "right", "top", "bottom", "cornerRadius"]) {
        margins[e] = parseFloat(xmlboard.getAttribute(e));
    }

    var camera = {};

    for(var e of ["x", "y", "radius"]) {
        camera[e] = parseFloat(xmlcamera.getAttribute(e));
    }

    var thickness = parseFloat(xmlboard.getAttribute("thickness"));

    var windows = [];
    for(var w of xmlwindows.getElementsByTagName("window")) {
        var window = {};
        window["side"] = w.getAttribute("side");
        
        for (var e of ["begin", "end", "bottom", "top"]) {
            if (w.hasAttribute(e)) {
                window[e] = parseFloat(w.getAttribute(e));
            }
        }

        windows.push(window);
    }

    return new Device(name, id, screen, margins, thickness, camera, windows);

}

Device.prototype.getWindowsBySide = function(side, filterByOpen = false) {
    var res = this.windows.filter(w => w["side"] == side);
    if (filterByOpen)
        res = res.filter(x => ! ("top" in x));
    return res;
}



Device.prototype.getInnerSize = function(params) {
    var w = this.getWidth() + parseFloat(params["deviceBuffer"]) * 2;
    var h = this.getHeight() + parseFloat(params["deviceBuffer"]) * 2;
    return [w, h];
}


/**
 *  start: (x, y) coordinate 
 *  xDirection: boolean (is it x direction?)
 *  length: float, length of the line
 *  shiftSlots: float, shift length before the slot section
 *  lengthSlotSection: float, length of the slot section
 *  depthSlots: float, depth of the slots
 *  sideSlots: boolean, left or right (wrt the direction of the line)
 *  kerf: space to add to the slots
 * 
 */
Device.prototype.autoSlotLine = function (start, xDirection, length, shiftSlotSection, lengthSlotSection, depthSlots, sideSlots, kerf, foolproof) {
    var slots = this.autoSlots(lengthSlotSection, shiftSlotSection, depthSlots, sideSlots, kerf, foolproof);
    return this.slotLine(start, xDirection, length, slots);
}

Device.prototype.upSlotsFromWindows = function(windows, totalWidth, side, kerf) {
    var result = [];

    for(w of windows) {
        result.push({ "start": w["begin"] + 2 * kerf, "end": w["end"],  "depth": totalWidth - w["bottom"], "side": side});
    }
    return result;
}

Device.prototype.slotLine = function(start, xDirection, length, slots) {
    var result = [];

    
    // compute orientation
    var sign = 1;
    if (length < 0) sign = -1;


    // first sort slots by start
    slots.sort(function (a, b) { return a["start"] - b["start"]; });

    // add slots
    for(var slot of slots) {
        var sSlot = slot["start"];
        var eSlot = slot["end"];

        var chamferStart = 0;
        var chamferEnd = 0;
        if ("chamferStart" in slot) chamferStart = slot["chamferStart"];
        if ("chamferEnd" in slot) chamferEnd = slot["chamferEnd"];

        // compute slot orientation
        var signSlot = sign;
        if (slot["side"])
            signSlot *= -1;
        var slotDepth = slot["depth"];

        if (xDirection) {
            if (chamferStart < 0 && Math.abs(sSlot + chamferStart) >= 0) {
                result.push([start[0] + sign * (sSlot + chamferStart), start[1]]);
                result.push([start[0] + sign * sSlot, start[1] + signSlot * (-chamferStart)]);
            }
            else {
                result.push([start[0] + sign * sSlot, start[1]]);
            }

            if (chamferStart > 0) {
                result.push([start[0] + sign * sSlot, start[1] + signSlot * (slotDepth - chamferStart)]);
                result.push([start[0] + sign * (sSlot + chamferStart), start[1] + signSlot * slotDepth]);
            }
            else {
                result.push([start[0] + sign * sSlot, start[1] + signSlot * slotDepth]);
            }
            
            if (chamferEnd > 0) {
                result.push([start[0] + sign * (eSlot - chamferEnd), start[1] + signSlot * slotDepth]);
                result.push([start[0] + sign * eSlot, start[1] + signSlot * (slotDepth - chamferEnd)]);
            }
            else {
                result.push([start[0] + sign * eSlot, start[1] + signSlot * slotDepth]);
            }

            if (chamferEnd < 0 && Math.abs(eSlot - chamferEnd) <= Math.abs(length)) {
                result.push([start[0] + sign * eSlot, start[1] + signSlot * (-chamferEnd)]);
                result.push([start[0] + sign * (eSlot - chamferEnd), start[1]]);
            }
            else {
                result.push([start[0] + sign * eSlot, start[1]]);
            }
        }
        else {
            if (chamferStart < 0 && Math.abs(sSlot + chamferStart) >= 0) {
                result.push([start[0], start[1] + sign * (sSlot + chamferStart)]);
                result.push([start[0] - signSlot * (-chamferStart), start[1] + sign * sSlot]);
            }
            else {
                result.push([start[0], start[1] + sign * sSlot]);
            }

            if (chamferStart > 0) {
                result.push([start[0] - signSlot * (slotDepth - chamferStart), start[1] + sign * sSlot]);
                result.push([start[0] - signSlot * slotDepth, start[1] + sign * (sSlot + chamferStart)]);
            }
            else {
                result.push([start[0] - signSlot * slotDepth, start[1] + sign * sSlot]);
            }

            if (chamferEnd > 0) {
                result.push([start[0] - signSlot * slotDepth, start[1] + sign * (eSlot - chamferEnd)]);
                result.push([start[0] - signSlot * (slotDepth - chamferEnd), start[1] + sign * eSlot]);
            }
            else {
                result.push([start[0] - signSlot * slotDepth, start[1] + sign * eSlot]);
            }
            
            if (chamferEnd < 0 && Math.abs(eSlot - chamferEnd) <= Math.abs(length)) {
                result.push([start[0] - signSlot * (-chamferEnd), start[1] + sign * eSlot]);
                result.push([start[0], start[1] + sign * (eSlot - chamferEnd)]);
            }
            else {
                result.push([start[0], start[1] + sign * eSlot]);
            }
        }

    }

    // add the end of the line
    if (result.length < 2 || distance(start, result[result.length - 1]) < Math.abs(length)) {
        if (xDirection) {
            result.push([start[0] + length, start[1]]);
        }
        else {
            result.push([start[0], start[1] + length]);
        }
    }
    else {
        result.push(result[result.length - 1]);
    }

    return result;
}

Device.prototype.autoMultiSlotLines = function(start, windows, posDir, length, invert, shiftBegin, slotDepth, kerf, foolproof) {
    var sideLine;
    var kerf2 = kerf * 2;

    var sign = 1.0;
    if (!posDir)
        sign = - 1.0;

    var st;

    if (shiftBegin)
        st = [start[0] + sign * (slotDepth - kerf2), start[1]];
    else
        st = [start[0], start[1]];
    var ist = st;
    var sideLine = [st];

    var elements = this.getSubElements(windows, length);
    var lastEnd = 0;
    for(var e of elements) {
        var lshift = e["begin"] - lastEnd;
        if (st == null) {
            st = sideLine[sideLine.length - 1];
        }
        var line = this.autoSlotLine(st, true, sign * (e["length"] + lshift), lshift, e["length"], slotDepth, true, kerf, foolproof);
        // if the last point has been removed
        if (line.length >= 2 && distance(line[line.length - 1], line[line.length - 2]) == 0) {
            st = [line[line.length - 1][0] - sign * kerf2, line[line.length - 1][1]];
        }
        else
            st = null;
        sideLine = sideLine.concat(line);
        lastEnd = e["begin"] + e["length"];
    }
    if (invert)
        sideLine = DrawCuttingTools.pathSymmetryX(sideLine, (ist[0] + sideLine[sideLine.length - 1][0]) / 2);

    if (!shiftBegin) {
        sideLine.push([sideLine[sideLine.length - 1][0] + sign * slotDepth, sideLine[sideLine.length - 1][1]]);
    }
    
    return sideLine;
}


Device.prototype.drawNumberSquare = function (nb, corner, direction) {
    var result = [];

    var inSquare = nb;
    if (nb == 5) inSquare = 4;
    
    var square = [corner];

    if (direction == this.nVertical) {
        square.push([corner[0], corner[1] + this.squareSize]);
        if (nb >= 2)
            square.push([corner[0] + this.squareSize, corner[1] + this.squareSize]);
        if (nb >= 3)
            square.push([corner[0] + this.squareSize, corner[1]]);
        if (nb >= 4)
            square.push(corner);
        if (nb == 5)    
            square.push([corner[0] + this.squareSize, corner[1] + this.squareSize]);
    }
    else {
        square.push([corner[0] + this.squareSize, corner[1]]);
        if (nb >= 2)
            square.push([corner[0] + this.squareSize, corner[1] + this.squareSize]);
        if (nb >= 3)
            square.push([corner[0], corner[1] + this.squareSize]);
        if (nb >= 4)
            square.push(corner);
        if (nb == 5)    
            square.push([corner[0] + this.squareSize, corner[1] + this.squareSize]);

    }

    result.push(square);

    return result;
}

Device.prototype.drawPartialNumberSquare = function (nb, center, direction, squareID, nbSquares) {

    var totalWidth = nbSquares * this.squareSize + (nbSquares - 1) * this.squareSpace;
    var relativeShift = squareID * this.squareSize + squareID * this.squareSpace;

    var corner = [center[0], center[1]];
    
    if (direction == this.nVertical) {
        corner[0] -= totalWidth / 2;
        corner[0] += relativeShift;
        corner[1] -= this.squareSize / 2;
    }
    else if (direction == this.nHorizontal) {
        corner[0] -= this.squareSize / 2;
        corner[1] -= totalWidth / 2;
        corner[1] += relativeShift;
    }

    var result = this.drawNumberSquare(nb, corner, direction);
    return result;
}

Device.prototype.nVertical = true;
Device.prototype.nHorizontal = false;
Device.prototype.nShift = 2;
Device.prototype.squareSize = 2;
Device.prototype.squareSpace = 0.5;
Device.prototype.drawNumber = function(number, centerx, centery, direction, dist) {
    var center = [ centerx, centery ];
    if (direction == this.nHorizontal)
        center[0] += dist;
    else
        center[1] += dist;
    result = [];
    
    var nbSquares = Math.ceil(number / 5);
    for(var squareID = 0; squareID < nbSquares; ++squareID) {
        var nb;
        if (squareID != nbSquares - 1)
            nb = 5;
        else {
            nb = number % 5;
            if (nb == 0)
                nb = 5;
        }
        
        result = result.concat(this.drawPartialNumberSquare(nb, center, direction, squareID, nbSquares));
    }

    return result;
    
}

Device.prototype.numberSize = function(number) {
    var nbSquares = Math.ceil(number / 5);
    return nbSquares * this.squareSize + (nbSquares - 1) * this.squareSpace;
}

Device.prototype.getPiecesBetweenWindows = function(windows, length) {
    var begin = 0;
    var result = [];
    if (windows.length == 0) {
        result.push({"begin": begin, "end": length});
        return result;
    }
    
    for(var key in windows) {
        result.push({"begin": begin, "end": windows[key]["begin"]});
        begin = windows[key]["end"];
    }
    result.push({"begin": begin, "end": length});
    return result;
}

Device.prototype.getBackCutting = function(params) {
    var cuttings = [];
    var f = new Fastener();
    


    innerSize = this.getInnerSize(params);
    var slotDepth = parseFloat(params["boxThickness"]);

    var kerf = parseFloat(params["kerf"]);


    var back = [];

    var numbers = [];

    // create the contour

    var localKerfs = [ kerf ];
    if (this.debug) // draw the inner shape (without kerf) to check if the drawing is correct
        localKerfs.push(0.0);

    var idSide = 7;
    for (var key in localKerfs) {
        lkerf = localKerfs[key];

        var lkerf2 = lkerf * 2;

        var cBack = [[kerf - lkerf, kerf - lkerf]];

        // first fastener
        if (key == 0)
            numbers = numbers.concat(this.drawNumber(1, cBack[cBack.length - 1][0] + (f.height + lkerf2) / 2, cBack[cBack.length - 1][1], this.nVertical, this.nShift));
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], true, f.height + lkerf2, 0, f.height, slotDepth, true, lkerf, 1));

        if (key == 0)
            numbers = numbers.concat(this.drawNumber(2, cBack[cBack.length - 1][0], cBack[cBack.length - 1][1] + (f.width - slotDepth) / 2, this.nHorizontal, -this.nShift));
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, f.width - slotDepth, 0, f.width - slotDepth, slotDepth, true, lkerf, 0));

        // first side
        var lwindows = this.getWindowsBySide("left");
        if (key == 0) {
            var lpieces = this.getPiecesBetweenWindows(lwindows, innerSize[1] - f.height - slotDepth);
            for(var lkey in lpieces) {
                var piece = lpieces[lkey];
                numbers = numbers.concat(this.drawNumber(idSide, innerSize[1] - (piece["begin"] + (piece["end"] - piece["begin"]) / 2), cBack[cBack.length - 1][1], this.nVertical, this.nShift));
                idSide += 1;
            }
        }
        var sideLine = this.autoMultiSlotLines(cBack[cBack.length - 1], lwindows, true, innerSize[1] - f.height - slotDepth, true, true, slotDepth, lkerf, 1);
        cBack = cBack.concat(sideLine);

        // upper part
        if (key == 0)
            numbers = numbers.concat(this.drawNumber(3, cBack[cBack.length - 1][0], cBack[cBack.length - 1][1] + (innerSize[0] + 2 * lkerf) / 2, this.nHorizontal, -this.nShift));
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, innerSize[0] + 2 * lkerf, 0, innerSize[0], slotDepth, true, lkerf, -1));

        // second side
        var rwindows = this.getWindowsBySide("right");
        if (key == 0) {
            var rpieces = this.getPiecesBetweenWindows(rwindows, innerSize[1] - f.height - slotDepth);
            for(var lkey in rpieces) {
                var piece = rpieces[lkey];
                var size2 = this.numberSize(idSide) / 2;
                if (piece["begin"] + (piece["end"] - piece["begin"]) / 2 - size2 < 0) {
                    piece["end"] = piece["begin"] + size2 * 2 + this.squareSpace;
                }
                numbers = numbers.concat(this.drawNumber(idSide, innerSize[1] - (piece["begin"] + (piece["end"] - piece["begin"]) / 2), cBack[cBack.length - 1][1], this.nVertical, -this.nShift));
                idSide += 1;
            }
        }
        var sideLine = this.autoMultiSlotLines(cBack[cBack.length - 1], this.getWindowsBySide("right"), false, innerSize[1] - f.height - slotDepth, false, false, slotDepth, lkerf, 1);
        cBack = cBack.concat(sideLine);

        // second fastener
        if (key == 0)
            numbers = numbers.concat(this.drawNumber(4, cBack[cBack.length - 1][0], cBack[cBack.length - 1][1] + (f.width - slotDepth) / 2, this.nHorizontal, -this.nShift));
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, f.width - slotDepth, -lkerf, f.width - slotDepth - 2 * lkerf, slotDepth, true, lkerf, 0));

        if (key == 0)
            numbers = numbers.concat(this.drawNumber(5, cBack[cBack.length - 1][0] - (f.height + lkerf2) / 2, cBack[cBack.length - 1][1], this.nVertical, -this.nShift));        
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], true, -(f.height + lkerf2), 0, f.height, slotDepth, true, lkerf, -1));

        // close shape
        if (key == 0)
            numbers = numbers.concat(this.drawNumber(6, cBack[cBack.length - 1][0], cBack[cBack.length - 1][1] + (-(2 * (f.width - slotDepth) + innerSize[0] + lkerf2)) / 2, this.nHorizontal, this.nShift));
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, -(2 * (f.width - slotDepth) + innerSize[0] + lkerf2), - slotDepth, 2 * f.width + innerSize[0], slotDepth, true, lkerf, 1));

        back.push(cBack);
    }

    // create whole
    var box = Box.getBoundingBox(back);
    var middle = box.center();

    var hr = [15, 25];

    var hole = [ [middle[0] - hr[0], middle[1] - hr[1]], [middle[0] + hr[0], middle[1] - hr[1]],
                 [middle[0] + hr[0], middle[1] + hr[1]], [middle[0] - hr[0], middle[1] + hr[1]],
                 [middle[0] - hr[0], middle[1] - hr[1]] ];

    // first draw the numbers
    cuttings.push(numbers);
    // then cut the whole                 
    cuttings.push([hole]);
    // then cut the contour
    cuttings.push(back);


    return cuttings;
}

Device.prototype.cleanTinyEnds = function(polyline, epsilon) {
    if (polyline.length < 2)
        return polyline;

    var result = [];

    // remove the supplementary point used to close the shape
    polyline.pop();

    for(var i = 0; i < polyline.length; ) {
        var p1 = polyline[i];
        var p2 = polyline[(i + 1) % polyline.length];
        if (distance(p1, p2) <= epsilon) {
            var p0 = polyline[(i - 1) % polyline.length];
            var p3 = polyline[(i + 2) % polyline.length];
            // add a new point
            if (distance(p0, p1) < distance(p3, p1)) {
                result.push(fourthPoint(p0, p1, p2));
            }
            else {
                result.push(fourthPoint(p3, p1, p2));
            }
            i += 2;            
        }
        else {
            result.push(p1);
            ++i;
        }
    }

    // add the supplementary point to close the shape
    result.push(result[0]);
    
    return result;
}

Device.prototype.rectangleWithSlots = function(width, height, kerf, slots1, slots2, slots3, slots4) {
    var result = [[0, 0]];
    var kerf2 = kerf * 2;

    result = result.concat(this.slotLine(result[result.length - 1], true, width + kerf2, slots1));
    result = result.concat(this.slotLine(result[result.length - 1], false, height + kerf2, slots2));
    result = result.concat(this.slotLine(result[result.length - 1], true, -(width + kerf2), slots3));
    result = result.concat(this.slotLine(result[result.length - 1], false, -(height + kerf2), slots4));
    result = this.cleanTinyEnds(result, kerf);

    return result;
}

/*
 \param length Length of the side to turn into a series of slots
 \param shift Initial shift
 \param depth Size of the slots
 \param side On which side the slots will be drawn
 \param kerf Laser kerf
 \param foolproof -1, 0 or 1 depending on the shift for foolproofing
*/
Device.prototype.autoSlots = function(length, shift, depth, side, kerf, foolproof) {
    var largeSlot = 10;
    var smallSlot = 4;
    var space = -0.1;
    var chamfer = 0.2;

    if (!side) space = -space;

    chamfer = chamfer + kerf;
    if (!side) chamfer = -chamfer;

    if (foolproof == null)
        foolproof = 0;

    var largeSlotInit = largeSlot;
    var smallSlotInit = smallSlot;

    if (side) {
        largeSlot += 2 * kerf;
        smallSlot += 2 * kerf;
    }
    else {
        largeSlot -= 2 * kerf;
        smallSlot -= 2 * kerf;
    }

    var lshift = shift + kerf;

    if (length < smallSlotInit * 1.2) {
        result = [];
    }
    else if (length < smallSlotInit * 2) {
        result = [ { "start": lshift + length - smallSlot / 2 - space, 
                     "end": lshift + length + kerf + space,  
                     "depth": depth, 
                     "side": side,
                     "chamferStart": chamfer, "chamferEnd": chamfer
                    } ];
    }
    else if (length < smallSlotInit * 4) {
        smallshift = length / 8;
        if (foolproof == 0) smallshift = 0; else smallshift *= foolproof;
        location1 = lshift + length / 2 + smallshift;
        result = [ { "start": location1 - smallSlot / 2 - space, 
                     "end": location1 + smallSlot / 2 + space,  
                     "depth": depth, 
                     "side": side,
                     "chamferStart": chamfer, "chamferEnd": chamfer
                    } ];
    }
    else if (length < largeSlotInit * 2) {
        smallshift = length / 16;
        if (foolproof == 0) smallshift = 0; else smallshift *= foolproof;
        location1 = lshift + length / 4 + smallshift;
        location2 = lshift + 3 * length / 4 + smallshift;
        result = [ { "start": location1 - smallSlot / 2 - space, 
                     "end": location1 + smallSlot / 2 + space,  
                     "depth": depth, 
                     "side": side,
                     "chamferStart": chamfer, "chamferEnd": chamfer
                   },
                   { "start": location2 - smallSlot / 2 - space,
                     "end": location2 + smallSlot / 2 + space,  
                     "depth": depth, 
                     "side": side,
                     "chamferStart": chamfer, "chamferEnd": chamfer
                    }
        ];
    }
    else if (length < largeSlotInit * 4) {
        smallshift = length / 8;
        if (foolproof == 0) smallshift = 0; else smallshift *= foolproof;
        location1 = lshift + length / 2 + smallshift;
        result = [ { "start": location1 - largeSlot / 2 - space, 
                     "end": location1 + largeSlot / 2 + space,  
                     "depth": depth, 
                     "side": side,
                     "chamferStart": chamfer, "chamferEnd": chamfer
                    } ];
    }
    else {
        smallshift = length / 16;
        if (foolproof == 0) smallshift = 0; else smallshift *= foolproof;
        location1 = lshift + length / 4 + smallshift;
        location2 = lshift + 3 * length / 4 + smallshift;
        result = [ { "start": location1 - largeSlot / 2 - space, 
                     "end": location1 + largeSlot / 2 + space,  
                     "depth": depth, 
                     "side": side,
                     "chamferStart": chamfer, "chamferEnd": chamfer
                    },
                   { "start": location2 - largeSlot / 2 - space, 
                     "end": location2 + largeSlot / 2 + space,  
                     "depth": depth, 
                     "side": side,
                     "chamferStart": chamfer, "chamferEnd": chamfer
                    }
        ];
    }
    return result;
}


Device.prototype.getSubElements = function(windows, length) {
    var result = [];
    var pos = windows.map(x => x["begin"]).concat(windows.map(x => x["end"])).concat([0, length]);
    pos = pos.filter(p => p <= length);
    pos.sort((a, b) => a - b);

    for(var i = 0; i < pos.length; i += 2) {
        var open = pos[i] == 0;
        var close = pos[i + 1] == length;
        result.push({ "open": open, "close": close,
                    "begin": pos[i], "length": pos[i + 1] - pos[i]});
    }

    return result;
}

Device.prototype.getSidesCutting = function(params, space) {
    var cuttings = [];
    var f = new Fastener();

    innerSize = this.getInnerSize(params);

    var kerf = parseFloat(params["kerf"]) / 2;


    var deviceThickness = this.thickness;
    var boxThickness = parseFloat(params["boxThickness"]);
    var boardThickness = parseFloat(params["boardThickness"]);
    var slotDepth = boxThickness;

    var innerCuts = [];
    var sides = [];
    var numbers = [];

    var localKerfs = [ kerf ];
    if (this.debug) // draw the inner shape (without kerf) to check if the drawing is correct
        localKerfs.push(0.0);

    for (var key in localKerfs) {
        lkerf = localKerfs[key];

        // bottom side
        sides.push(DrawCuttingTools.pathShift(this.rectangleWithSlots(deviceThickness + 2 * boardThickness, innerSize[0] + 2 * f.width, lkerf,
                                    this.autoSlots(deviceThickness, 2 * boxThickness, slotDepth, false, lkerf, 0),
                                    this.autoSlots(innerSize[0] + 2 * f.width, 0, slotDepth, false, lkerf, -1),
                                    this.autoSlots(deviceThickness, 0, slotDepth, false, lkerf, 0),
                                    []), kerf - lkerf, kerf - lkerf
        ));
    }
    numbers = numbers.concat(this.drawNumber(6, (deviceThickness + 2 * boardThickness) / 2, (innerSize[0] + 2 * f.width) / 2, this.nHorizontal, 0));

     
    var shift = deviceThickness + boxThickness + boardThickness + space;
    
    // sides of the fasteners
    for(var i = 0; i != 2; ++i) {

        var middle;
        for (var key in localKerfs) {
            lkerf = localKerfs[key];
            var side1 = DrawCuttingTools.pathShift(
                            this.rectangleWithSlots(deviceThickness, f.height + boxThickness, lkerf,
                                    this.autoSlots(deviceThickness, 0, slotDepth, true, lkerf, 0),
                                    this.autoSlots(f.height, 0, slotDepth, false, lkerf, 1),
                                    this.autoSlots(deviceThickness, 0, slotDepth, false, lkerf, 0),
                                    this.autoSlots(f.height, boardThickness, slotDepth * 3, true, lkerf, -1)),
                                    shift + 3 * boxThickness + kerf - lkerf, i * (f.height + 2 * boxThickness + space) + kerf - lkerf);
            middle = Box.getBoundingBox(side1).center();
            if (i == 1) side1 = DrawCuttingTools.pathSymmetryXMiddle(side1);
            sides.push(side1);
        }
        var numberside1 = this.drawNumber(5 - i * 4, deviceThickness / 2, (f.height + boxThickness) / 2, this.nHorizontal, 0);
        numberside1 = DrawCuttingTools.multipathShift(numberside1, shift + 3 * boxThickness, i * (f.height + 2 * boxThickness + space));
        if (i == 1) numberside1 = DrawCuttingTools.multipathSymmetryX(numberside1, middle[0]);
        numbers = numbers.concat(numberside1);

        for (var key in localKerfs) {
            lkerf = localKerfs[key];
            var side2 = DrawCuttingTools.pathShift(
                this.rectangleWithSlots(deviceThickness, f.width - boxThickness, lkerf,
                        this.autoSlots(deviceThickness, 0, slotDepth, true, lkerf, 0),
                        this.autoSlots(f.width - boxThickness, 0, slotDepth, false, lkerf, 0),
                        this.autoSlots(deviceThickness, 0, slotDepth, false, lkerf, 0),
                        this.autoSlots(f.width - boxThickness, 0, slotDepth, true, lkerf, 0)),
                        shift + 3 * boxThickness + kerf - lkerf, (f.height + 2 * boxThickness + space) * 2 + slotDepth + i * (f.width + 2 * kerf + 2 * space) + kerf - lkerf);        
            middle = Box.getBoundingBox(side1).center();
            if (i == 1) side2 = DrawCuttingTools.pathSymmetryXMiddle(side2);
            sides.push(side2);
        }
        var numberside2 = this.drawNumber(4 - i * 2, deviceThickness / 2, (f.width - boxThickness) / 2, this.nHorizontal, 0);
        numberside2 = DrawCuttingTools.multipathShift(numberside2,  
            shift + 3 * boxThickness, 
            (f.height + 2 * boxThickness + space) * 2 + slotDepth + i * (f.width + 2 * space));
        numbers = numbers.concat(numberside2);

    
    }

    shift += deviceThickness + 3 * boxThickness + space;

    var idSide = 7;
    var middleMirror = shift + (deviceThickness + boxThickness) / 2;
    // sides of the board
    for(var i = 0; i != 2; ++i) {
        var windows = this.getWindowsBySide(["left", "right"][i]);

        var elements = this.getSubElements(windows, innerSize[1] - f.height - boxThickness);
        for(var e of elements) {
            
            for (var key in localKerfs) {
                lkerf = localKerfs[key];

                var s1 = [];
                var startShiftInside = 0;
                var startShift = 0;
                if (e["open"]) {
                    s1 = this.autoSlots(deviceThickness + boxThickness, 0, slotDepth, false, lkerf, 0);
                    startShiftInside = boxThickness;
                }
                else {
                    startShift = boxThickness;
                }
                var s2 = [];
                if (e["close"]) {
                    s2 = this.autoSlots(deviceThickness, 0, slotDepth, true, lkerf, 0);
                }

                var sideH = DrawCuttingTools.pathShift(
                    this.rectangleWithSlots(deviceThickness + boxThickness, e["length"] + startShiftInside, lkerf,
                            s1,
                            this.autoSlots(e["length"], startShiftInside, slotDepth, false, lkerf, 1),
                            s2,
                            []),
                            shift + kerf - lkerf, i * ((innerSize[1] - f.height) + space + boxThickness) + e["begin"] + startShift + kerf - lkerf);  
                if (i == 1) sideH = DrawCuttingTools.pathSymmetryX(sideH, middleMirror);
                sides.push(sideH);

                if (key == 0) {
                    // draw numbers
                    var numberside = this.drawNumber(idSide, deviceThickness / 2, (e["length"] + startShiftInside) / 2, this.nHorizontal, 0);
                    numberside = DrawCuttingTools.multipathShift(numberside, shift, i * ((innerSize[1] - f.height) + space + boxThickness) + e["begin"] + startShift);
                    if (i == 1) numberside = DrawCuttingTools.multipathSymmetryX(numberside, middleMirror);
                    numbers = numbers.concat(numberside);
                    idSide += 1;
                }

            }


        }

        for(var w of windows) {
            if ("bottom" in w && "top" in w) {
                var r = new Box(deviceThickness - w["bottom"] + kerf, deviceThickness - w["top"] + kerf, 
                                boxThickness + w["begin"] + kerf, 
                                boxThickness + w["end"] + kerf);
                var cutX = DrawCuttingTools.pathShift(r.toPolyline(), shift, i * ((innerSize[1] - f.height) + space + boxThickness));
                if (i == 1) cutX = DrawCuttingTools.pathSymmetryX(cutX, middleMirror);
                innerCuts.push(cutX);
            }
        }
                
    }

    shift += deviceThickness + boxThickness + space;

    // create a slot for the QRcode shader
    var qp = new QRCodePosition();
    var shaderWidth = qp.getShaderSize() + 4; // add 2 millimeters in each side to avoid problems with misalignments
    var middleX = innerSize[0] / 2;
    var xCamera = this.camera["x"];

    // upper side

    for (var key in localKerfs) {
        lkerf = localKerfs[key];

        var shaderSlotKerf = [ { "start": middleX + xCamera - shaderWidth / 2 + 2 * lkerf,
            "end": middleX + xCamera + shaderWidth / 2, 
            "depth": boardThickness, 
            "side": false} ];

        sides.push(DrawCuttingTools.pathShift(
            this.rectangleWithSlots(deviceThickness + boxThickness + boardThickness, innerSize[0], lkerf,
                    this.autoSlots(deviceThickness + boxThickness, boardThickness, slotDepth, true, lkerf, 0),
                    this.autoSlots(innerSize[0], 0, slotDepth, false, lkerf, 1),
                    this.autoSlots(deviceThickness + boxThickness, 0, slotDepth, true, lkerf, 0),
                    this.upSlotsFromWindows(this.getWindowsBySide("top", true), deviceThickness + boardThickness, false, lkerf).concat(shaderSlotKerf)),
                    shift + kerf - lkerf, kerf - lkerf));
    }
    numbers = numbers.concat(DrawCuttingTools.multipathShift(
        this.drawNumber(3, (deviceThickness + boxThickness + boardThickness) / 2, innerSize[0] / 2, this.nHorizontal, 0),
        shift, 0));


    // draw windows in the upper part
    var windows = this.getWindowsBySide("top");
    for(var w of windows) {
        if ("bottom" in w && "top" in w) {
            var r = new Box(deviceThickness + boardThickness - w["bottom"], 
                            deviceThickness + boardThickness - w["top"], 
                            w["begin"], w["end"]);
            innerCuts.push(DrawCuttingTools.pathShift(r.toPolyline(), shift, 0));
        }
    }
    


    shift += deviceThickness + boxThickness + boardThickness + space;

    // add the upper part of the fasteners
    for(var i = 0; i != 2; ++i) {


        for (var key in localKerfs) {
            lkerf = localKerfs[key];

            var sideF = DrawCuttingTools.pathShift(
                this.rectangleWithSlots(f.width, f.height + boxThickness, lkerf,
                        this.autoSlots(f.width - slotDepth, 0, slotDepth, false, lkerf, 0),
                        this.autoSlots(f.height, boxThickness, slotDepth, false, lkerf, -1),
                        [],
                        []),
                            shift + kerf - lkerf, i * (f.height + boxThickness + space) + kerf - lkerf);
            
            if (i == 1) sideF = DrawCuttingTools.pathSymmetryXMiddle(sideF);
            sides.push(sideF);
        }

        var numberside = this.drawNumber(1 + i * 4, f.width / 2, f.height / 2, this.nHorizontal, 0);
        numberside = DrawCuttingTools.multipathShift(numberside, shift, i * (f.height + boxThickness + space));
        if (i == 1) numberside = DrawCuttingTools.multipathSymmetryXMiddle(numberside);
        numbers = numbers.concat(numberside);


    }

    shift += f.width + space;

    // the second upper part of the fasteners
    for(var i = 0; i != 2; ++i) {
        var gap = 0.3;

        for (var key in localKerfs) {
            lkerf = localKerfs[key];

            
            var side7 = f.shape(gap, lkerf);
            side7.push([0, f.height - gap + 2 * lkerf]);
            side7 = side7.concat(this.autoSlotLine(side7[side7.length - 1], false, -f.height + gap - 2 * lkerf, -gap, f.height, slotDepth, false, lkerf, -1));
            side7.push(side7[0]);
            
            if (i == 1) side7 = DrawCuttingTools.pathSymmetryXMiddle(side7);

            sides.push(DrawCuttingTools.pathShift(side7, shift + kerf - lkerf, (f.height + boxThickness + space) * i + kerf - lkerf));   
        }

        var numberside = this.drawNumber(1 + i * 4, f.width / 2, f.width / 2, this.nHorizontal, 0);
        numberside = DrawCuttingTools.multipathShift(numberside, shift, i * (f.height + boxThickness + space));
        if (i == 1) numberside = DrawCuttingTools.multipathSymmetryXMiddle(numberside);
        numbers = numbers.concat(numberside);
    }

    shift += f.width + space;
    
    // the third upper part of the fasteners
    for(var i = 0; i != 2; ++i) {
        var gap = 0.6;


        for (var key in localKerfs) {
            lkerf = localKerfs[key];

            var side7 = f.shape(gap, lkerf, true);
            side7.push([0, f.height - gap + 2 * lkerf]);
            side7 = side7.concat(this.autoSlotLine(side7[side7.length - 1], false, -f.height + gap - 2 * lkerf, -gap, f.height, slotDepth, false, lkerf, -1));
            side7.push(side7[0]);
            
            if (i == 1) side7 = DrawCuttingTools.pathSymmetryXMiddle(side7);

            sides.push(DrawCuttingTools.pathShift(side7, shift + kerf - lkerf, (f.height + boxThickness + space) * i + kerf - lkerf));   
        }

        var numberside = this.drawNumber(1 + i * 4, f.width / 2, f.width / 2, this.nHorizontal, 0);
        numberside = DrawCuttingTools.multipathShift(numberside, shift, i * (f.height + boxThickness + space));
        if (i == 1) numberside = DrawCuttingTools.multipathSymmetryXMiddle(numberside);
        numbers = numbers.concat(numberside);

    }

    // first draw the numbers
    cuttings.push(numbers);
    // then inner cuts
    cuttings.push(innerCuts);
    // finally, sides
    cuttings.push(sides);


    return cuttings;
}

Device.prototype.boxPDF = function(params) {
    var A4width = 210;
    var A4height = 297;

    // create a new pdf
    var doc = new jsPDF();
    doc.setDrawColor("#000000");
    doc.setLineWidth(0.05);

    // draw the back cutting
    var cut = this.getBackCutting(params);
    var box = Box.getBoundingBox(cut);

    if (box == null || box.width > A4width || box.height > A4height)
        return null;

    var scale = params["scale"];
    
    var shiftx = (A4width - box.width() * scale) / 2;
    var shifty = (A4height - box.height() * scale) / 2;

    for(var layer of cut) {
        for(var path of layer) {
            // compute relative coordinates
            var shiftPL = DrawCuttingTools.pathAbsoluteToRelative(DrawCuttingTools.scale(path, scale));
            
            doc.lines(shiftPL, path[0][0] * scale + shiftx, path[0][1] * scale + shifty);
        }
    }
    
    // add a second page
    doc.addPage();
    doc.setDrawColor("#000000");
    doc.setLineWidth(0.01);


    // draw side cuttings
    cut = this.getSidesCutting(params, 10);
    box = Box.getBoundingBox(cut);

    if (box == null || box.width > A4width || box.height > A4height)
        return null;

    shiftx = (A4width - box.width() * scale) / 2;
    shifty = (A4height - box.height() * scale) / 2;

    for(var layer of cut) {
        for(var path of layer) {
            // compute relative coordinates
            var shiftPL = DrawCuttingTools.pathAbsoluteToRelative(DrawCuttingTools.scale(path, scale));
            
            doc.lines(shiftPL, path[0][0] * scale + shiftx, path[0][1] * scale + shifty);
        }
    }

    return doc;
}

Device.prototype.boxDXF = function(params) {
    var Drawing = require('Drawing');
    var d = new Drawing();
    d.setUnits('Millimeters');

    var space = parseFloat(params["boxThickness"]) * 1.5 + parseFloat(params["kerf"]);

    var cut = this.getBackCutting(params);
    var box = Box.getBoundingBox(cut);
    var middle = box.center();

    var id = 0;
    for(var layer of cut) {
        if (id != 0) {
            // 8 different colors are defined by js-dxf
            // see Drawing.ACI (Autocad Color Index)
            d.addLayer("l_" + id, id % 8, 'CONTINUOUS');
            d.setActiveLayer("l_" + id);
        }
        id += 1;
        for(var path of layer) {
            // y axis is inverted wrt pdf
            path = DrawCuttingTools.pathSymmetryY(path, middle[1]);
            d.drawPolyline(path);
        }
    }

    // get side cuttings
    cut = this.getSidesCutting(params, space);

    // draw side cuttings
    id = 0;
    for(var layer of cut) {

        // 8 different colors are defined by js-dxf
        // see Drawing.ACI (Autocad Color Index)
        if (id == 0) {
            d.setActiveLayer("0");
        }
        else {
            d.setActiveLayer("l_" + (id % 8));
        }

        id += 1;
        for(var path of layer) {
            // y axis is inverted wrt pdf
            path = DrawCuttingTools.pathSymmetryY(path, middle[1]);
            path = DrawCuttingTools.pathShift(path, box.right + space, 0);
            d.drawPolyline(path);
        }
    }

    return d;
}
