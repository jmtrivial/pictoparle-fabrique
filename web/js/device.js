

class Device {
    
    constructor(name, id, screen, margins, thickness, camera) {
        this.name = name;
        this.id = id;
        this.screen = screen;
        this.margins = margins;
        this.thickness = thickness;
        this.camera = camera;

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

Device.fromXML = function(xml) {
    var xmldevice = xml.getElementsByTagName("device")[0];
    var xmlscreen = xml.getElementsByTagName("screen")[0];
    var xmlmargins = xml.getElementsByTagName("margins")[0];
    var xmlcamera = xml.getElementsByTagName("camera")[0];
    var xmlthickness = xml.getElementsByTagName("thickness")[0];

    var name = xmldevice.getAttribute("name");
    var id = xmldevice.getAttribute("id");

    var screen = {};
    for (var e of ["width", "height"]) {
        screen[e] = parseFloat(xmlscreen.getAttribute(e));
    }

    var margins = {};
    for (var e of ["left", "right", "top", "bottom", "cornerRadius"]) {
        margins[e] = parseFloat(xmlmargins.getAttribute(e));
    }

    var camera = {};

    for(var e of ["x", "y", "radius"]) {
        camera[e] = parseFloat(xmlcamera.getAttribute(e));
    }

    var thickness = parseFloat(xmlthickness.getAttribute("value"));

    return new Device(name, id, screen, margins, thickness, camera);

}


Device.prototype.getInnerSize = function(params) {
    var w = this.getWidth() + parseFloat(params["deviceBuffer"]) * 2;
    var h = this.getHeight() + parseFloat(params["deviceBuffer"]) * 2;
    return [w, h];
}

Device.prototype.slotLine = function(start, xDirection, length, slotPositions, slotLength, slotDepth, leftSide) {
    var result = [];

    // compute orientation
    var sign = 1;
    if (length < 0) sign = -1;

    // compute slot orientation
    var signSlot = sign;
    if (leftSide)
        signSlot *= -1;

    // add slots
    for(var slot of slotPositions) {
        var sSlot = slot - slotLength / 2;
        var eSlot = slot + slotLength / 2;
        if (xDirection) {
            result.push([start[0] + sign * sSlot, start[1]]);
            result.push([start[0] + sign * sSlot, start[1] + signSlot * slotDepth]);
            result.push([start[0] + sign * eSlot, start[1] + signSlot * slotDepth]);
            result.push([start[0] + sign * eSlot, start[1]]);
        }
        else {
            result.push([start[0], start[1] + sign * sSlot]);
            result.push([start[0] - signSlot * slotDepth, start[1] + sign * sSlot]);
            result.push([start[0] - signSlot * slotDepth, start[1] + sign * eSlot]);
            result.push([start[0], start[1] + sign * eSlot]);
        }

    }

    // add the end of the line
    if (xDirection) {
        result.push([start[0] + length, start[1]]);
    }
    else {
        result.push([start[0], start[1] + length]);
    }

    return result;
}

Device.prototype.getBackCutting = function(params) {
    var cuttings = [];
    var f = new Fastener();
    


    innerSize = this.getInnerSize(params);
    var slotDepth = parseFloat(params["boxThickness"]);

    var kerf = parseFloat(params["kerf"]);
    var kerf2 = kerf * 2;
    var largeSlot = 10;
    var smallSlot = 4;
    var largeSlotK = largeSlot + kerf2;
    var smallSlotK = smallSlot + kerf2;


    var back = [];
    // create the contour
    var contour = [[0, 0]];
    // first fastener
    contour = contour.concat(this.slotLine(contour[contour.length - 1], true, f.height + kerf2, [f.height / 4 + kerf, 3 * f.height / 4 + kerf], largeSlotK, slotDepth, true));
    contour = contour.concat(this.slotLine(contour[contour.length - 1], false, f.width, [f.width / 2 + kerf], smallSlotK, slotDepth, true));

    // upper part
    contour = contour.concat(this.slotLine(contour[contour.length - 1], true, innerSize[1] - f.height, [(innerSize[1] - f.height) / 4 - kerf, 3 * (innerSize[1] - f.height) / 4 - kerf], largeSlotK, slotDepth, true));
    contour = contour.concat(this.slotLine(contour[contour.length - 1], false, innerSize[0] + kerf2, [innerSize[0] / 4 + kerf, 3 * innerSize[0] / 4 + kerf], largeSlotK, slotDepth, true));
    contour = contour.concat(this.slotLine(contour[contour.length - 1], true, -(innerSize[1] - f.height), [(innerSize[1] - f.height) / 4 + kerf, 3 * (innerSize[1] - f.height) / 4 + kerf], largeSlotK, slotDepth, true));


    // second fastener
    contour = contour.concat(this.slotLine(contour[contour.length - 1], false, f.width, [f.width / 2 - kerf], smallSlotK, slotDepth, true));
    contour = contour.concat(this.slotLine(contour[contour.length - 1], true, -f.height - kerf2, [f.height / 4 + kerf, 3 * f.height / 4 + kerf], largeSlotK, slotDepth, true));

    // close shape
    contour = contour.concat(this.slotLine(contour[contour.length - 1], false, -(2 * f.width + innerSize[0] + kerf2), [(2 * f.width + innerSize[0]) / 4 + kerf, 3 * (2 * f.width + innerSize[0]) / 4 + kerf], largeSlotK, slotDepth, true));

    back.push(contour);


    if (this.debug) {
        // draw the inner shape (without kerf) to check if the drawing is correct

        contour = [[kerf, kerf]];
        // first fastener
        contour = contour.concat(this.slotLine(contour[contour.length - 1], true, f.height, [f.height / 4, 3 * f.height / 4], largeSlot, slotDepth, true));
        contour = contour.concat(this.slotLine(contour[contour.length - 1], false, f.width, [f.width / 2], smallSlot, slotDepth, true));

        // upper part
        contour = contour.concat(this.slotLine(contour[contour.length - 1], true, innerSize[1] - f.height, [(innerSize[1] - f.height) / 4, 3 * (innerSize[1] - f.height) / 4], largeSlot, slotDepth, true));
        contour = contour.concat(this.slotLine(contour[contour.length - 1], false, innerSize[0], [innerSize[0] / 4, 3 * innerSize[0] / 4], largeSlot, slotDepth, true));
        contour = contour.concat(this.slotLine(contour[contour.length - 1], true, -(innerSize[1] - f.height), [(innerSize[1] - f.height) / 4, 3 * (innerSize[1] - f.height) / 4], largeSlot, slotDepth, true));


        // second fastener
        contour = contour.concat(this.slotLine(contour[contour.length - 1], false, f.width, [f.width / 2], smallSlot, slotDepth, true));
        contour = contour.concat(this.slotLine(contour[contour.length - 1], true, -f.height, [f.height / 4, 3 * f.height / 4], largeSlot, slotDepth, true));

        // close shape
        contour = contour.concat(this.slotLine(contour[contour.length - 1], false, -(2 * f.width + innerSize[0]), [(2 * f.width + innerSize[0]) / 4, 3 * (2 * f.width + innerSize[0]) / 4], largeSlot, slotDepth, true));

        back.push(contour);
    }

    // create whole
    var box = Box.getBoundingBox(back);
    var middle = box.center();

    var hr = [15, 25];

    var hole = [ [middle[0] - hr[0], middle[1] - hr[1]], [middle[0] + hr[0], middle[1] - hr[1]],
                 [middle[0] + hr[0], middle[1] + hr[1]], [middle[0] - hr[0], middle[1] + hr[1]],
                 [middle[0] - hr[0], middle[1] - hr[1]] ];

    // first cut the whole                 
    cuttings.push([hole]);
    // then cut the contour
    cuttings.push(back);

    return cuttings;
}

Device.prototype.getSidesCutting = function(params, space) {
    var cuttings = [];
    var f = new Fastener();

    innerSize = this.getInnerSize(params);

    var kerf = parseFloat(params["kerf"]);
    var kerf2 = kerf * 2;
    var largeSlot = 10;
    var smallSlot = 4;
    var largeSlotK = largeSlot + kerf2;
    var largeSlotNK = largeSlot - kerf2;
    var smallSlotK = smallSlot + kerf2;
    var smallSlotNK = smallSlot - kerf2;

    var deviceThickness = this.thickness;
    var boxThickness = parseFloat(params["boxThickness"]);
    var boardThickness = parseFloat(params["boardThickness"]);
    var slotDepth = boxThickness;

    // bottom side
    var side1 = [[0, 0]];
    side1 = side1.concat(this.slotLine(side1[side1.length - 1], true, deviceThickness + boxThickness + boardThickness + kerf2, 
        [(deviceThickness) / 2 + boxThickness + boardThickness + kerf], smallSlotNK, slotDepth, false));
    side1 = side1.concat(this.slotLine(side1[side1.length - 1], false, innerSize[0] + 2 * (f.width + boxThickness) + kerf2, 
        [(innerSize[0] + 2 * f.width) / 4 + boxThickness + kerf, 3 * (innerSize[0] + 2 * f.width) / 4 + boxThickness + kerf], largeSlotNK, slotDepth, false));
        side1 = side1.concat(this.slotLine(side1[side1.length - 1], true, -(deviceThickness + boxThickness + boardThickness + kerf2), 
            [(deviceThickness) / 2 + kerf], smallSlotNK, slotDepth, false));
    side1.push(side1[0]);

    var sides = [side1];

    if (this.debug) {
        side1 = [[kerf, kerf]];
        side1 = side1.concat(this.slotLine(side1[side1.length - 1], true, deviceThickness + boxThickness + boardThickness, 
            [(deviceThickness) / 2 + boxThickness + boardThickness], smallSlot, slotDepth, false));
        side1 = side1.concat(this.slotLine(side1[side1.length - 1], false, innerSize[0] + 2 * (f.width + boxThickness), 
            [(innerSize[0] + 2 * f.width) / 4 + boxThickness, 3 * (innerSize[0] + 2 * f.width) / 4 + boxThickness], largeSlot, slotDepth, false));
            side1 = side1.concat(this.slotLine(side1[side1.length - 1], true, -(deviceThickness + boxThickness + boardThickness), 
                [(deviceThickness) / 2], smallSlot, slotDepth, false));
        side1.push(side1[0]);
        
        sides.push(side1);
    }

    var shift = deviceThickness + boxThickness + boardThickness + space;
    
    // sides of the fasteners
    for(var i = 0; i != 2; ++i) {
        var side2 = [[0, 0]];
        side2 = side2.concat(this.slotLine(side2[side2.length - 1], true, deviceThickness + kerf2, 
            [(deviceThickness) / 2 + kerf], smallSlotK, slotDepth, true));
        side2 = side2.concat(this.slotLine(side2[side2.length - 1], false, f.height + boxThickness + kerf2, 
                [(f.height) / 4 + kerf, 3 * (f.height) / 4 + kerf], largeSlotNK, slotDepth, false));
        
        side2 = side2.concat(this.slotLine(side2[side2.length - 1], true, -(deviceThickness + kerf2), 
                [(deviceThickness) / 2 + kerf], smallSlotNK, slotDepth, false));
        
        side2 = side2.concat(this.slotLine(side2[side2.length - 1], false, -(f.height + boxThickness + kerf2), 
                    [(f.height) / 4 + boxThickness + kerf, 3 * (f.height) / 4 + boxThickness + kerf], largeSlotNK, 2 * boxThickness, true));

        sides.push(DrawCuttingTools.pathShift(side2, shift + 2 * boxThickness, i * (f.height + 2 * boxThickness + space)));

        if (this.debug) {
            side2 = [[kerf, kerf]];
            side2 = side2.concat(this.slotLine(side2[side2.length - 1], true, deviceThickness, 
                [(deviceThickness) / 2], smallSlot, slotDepth, true));
            side2 = side2.concat(this.slotLine(side2[side2.length - 1], false, f.height + boxThickness, 
                    [(f.height) / 4, 3 * (f.height) / 4], largeSlot, slotDepth, false));
            
            side2 = side2.concat(this.slotLine(side2[side2.length - 1], true, -(deviceThickness), 
                    [(deviceThickness) / 2], smallSlot, slotDepth, false));
            
            side2 = side2.concat(this.slotLine(side2[side2.length - 1], false, -(f.height + boxThickness), 
                        [(f.height) / 4 + boxThickness, 3 * (f.height) / 4 + boxThickness], largeSlot, 2 * boxThickness, true));
                    
    
            sides.push(DrawCuttingTools.pathShift(side2, shift + 2 * boxThickness, i * (f.height + 2 * boxThickness + space)));         
        }

        var side3 = [[0, 0]];
        side3 = side3.concat(this.slotLine(side3[side3.length - 1], true, deviceThickness + kerf2, 
            [(deviceThickness) / 2 + kerf], smallSlotK, slotDepth, true));
        side3 = side3.concat(this.slotLine(side3[side3.length - 1], false, f.width + kerf2, 
                [(f.width) / 2 + kerf], smallSlotNK, slotDepth, false));
        
        side3 = side3.concat(this.slotLine(side3[side3.length - 1], true, -(deviceThickness + kerf2), 
                [(deviceThickness) / 2 + kerf], smallSlotNK, slotDepth, false));
        
        side3 = side3.concat(this.slotLine(side3[side3.length - 1], false, -(f.width + kerf2), 
                    [(f.width) / 2 + kerf], smallSlotNK, 2 * boxThickness, true));
    
        sides.push(DrawCuttingTools.pathShift(side3, shift + 2 * boxThickness, (f.height + 2 * boxThickness + space) * 2 + slotDepth + i * (f.width + kerf2 + 2 * space)));

        if (this.debug) {
            side3 = [[kerf, kerf]];
            side3 = side3.concat(this.slotLine(side3[side3.length - 1], true, deviceThickness, 
                [(deviceThickness) / 2], smallSlot, slotDepth, true));
            side3 = side3.concat(this.slotLine(side3[side3.length - 1], false, f.width, 
                    [(f.width) / 2], smallSlot, slotDepth, false));
            
            side3 = side3.concat(this.slotLine(side3[side3.length - 1], true, -(deviceThickness), 
                    [(deviceThickness) / 2], smallSlot, slotDepth, false));
            side3 = side3.concat(this.slotLine(side3[side3.length - 1], false, -(f.width), 
                    [(f.width) / 2], smallSlot, 2 * boxThickness, true));
    
            sides.push(DrawCuttingTools.pathShift(side3, shift + 2 * boxThickness, (f.height + 2 * boxThickness + space) * 2 + slotDepth + i * (f.width + kerf2 + 2 * space)));

        }

    }

    shift += deviceThickness + 2 * boxThickness + space;

    // sides of the board
    for(var i = 0; i != 2; ++i) {
        var side4 = [[0, 0]];
        side4 = side4.concat(this.slotLine(side4[side4.length - 1], true, deviceThickness + boxThickness + kerf2, 
            [(deviceThickness) / 2 + kerf + boxThickness], smallSlotK, slotDepth, true));
        side4 = side4.concat(this.slotLine(side4[side4.length - 1], false, (innerSize[1] - f.height) + kerf2, 
                [(innerSize[1] - f.height) / 4 - boxThickness + kerf, 3 * (innerSize[1] - f.height) / 4 - boxThickness + kerf], largeSlotNK, slotDepth, false));
        
        side4 = side4.concat(this.slotLine(side4[side4.length - 1], true, -(deviceThickness + boxThickness + kerf2), 
                [(deviceThickness + boxThickness) / 2 + kerf], smallSlotNK, slotDepth, false));
        side4.push(side4[0]);

        sides.push(DrawCuttingTools.pathShift(side4, shift, i * ((innerSize[1] - f.height) + space + boxThickness)));

        if (this.debug) {
            side4 = [[kerf, kerf]];
            side4 = side4.concat(this.slotLine(side4[side4.length - 1], true, deviceThickness + boxThickness, 
                [(deviceThickness) / 2 + boxThickness], smallSlot, slotDepth, true));
            side4 = side4.concat(this.slotLine(side4[side4.length - 1], false, (innerSize[1] - f.height), 
                    [(innerSize[1] - f.height) / 4 - boxThickness, 3 * (innerSize[1] - f.height) / 4 - boxThickness], largeSlot, slotDepth, false));
            
            side4 = side4.concat(this.slotLine(side4[side4.length - 1], true, -(deviceThickness + boxThickness), 
                    [(deviceThickness + boxThickness) / 2], smallSlot, slotDepth, false));
            side4.push(side4[0]);

            sides.push(DrawCuttingTools.pathShift(side4, shift, i * ((innerSize[1] - f.height) + space + boxThickness)));
        }
    }

    shift += deviceThickness + boxThickness + space;

    var qp = new QRCodePosition();
    var widthQRCode = qp.dataMatrixHeightWithMargins + 4 * qp.marginQRCode;

    // upper side
    var side5 = [[0, 0]];
    side5 = side5.concat(this.slotLine(side5[side5.length - 1], true, deviceThickness + boxThickness + boardThickness + kerf2, 
        [(deviceThickness + boxThickness) / 2 + boardThickness + kerf], smallSlotK, slotDepth, true));
    side5 = side5.concat(this.slotLine(side5[side5.length - 1], false, innerSize[0] + kerf2, 
        [(innerSize[0]) / 4 + kerf, 3 * (innerSize[0]) / 4 + kerf], largeSlotNK, slotDepth, false));
    side5 = side5.concat(this.slotLine(side5[side5.length - 1], true, -(deviceThickness + boxThickness + boardThickness + kerf2), 
            [(deviceThickness + boxThickness) / 2 + kerf], smallSlotK, slotDepth, true));
    side5 = side5.concat(this.slotLine(side5[side5.length - 1], false, -innerSize[0] - kerf2, 
                [innerSize[0] / 2 + kerf], widthQRCode - kerf2, boardThickness, false));
    sides.push(DrawCuttingTools.pathShift(side5, shift, 0));

    if (this.debug) {
        side5 = [[kerf, kerf]];
        side5 = side5.concat(this.slotLine(side5[side5.length - 1], true, deviceThickness + boxThickness + boardThickness, 
            [(deviceThickness + boxThickness) / 2 + boardThickness], smallSlot, slotDepth, true));
        side5 = side5.concat(this.slotLine(side5[side5.length - 1], false, innerSize[0], 
            [(innerSize[0]) / 4, 3 * (innerSize[0]) / 4], largeSlot, slotDepth, false));
        side5 = side5.concat(this.slotLine(side5[side5.length - 1], true, -(deviceThickness + boxThickness + boardThickness), 
                [(deviceThickness + boxThickness) / 2], smallSlot, slotDepth, true));
        side5 = side5.concat(this.slotLine(side5[side5.length - 1], false, -innerSize[0], 
                    [innerSize[0] / 2], widthQRCode, boardThickness, false));
        sides.push(DrawCuttingTools.pathShift(side5, shift, 0));        
    }

    shift += deviceThickness + boxThickness + boardThickness + space;

    // add the upper part of the fasteners
    for(var i = 0; i != 2; ++i) {
        var side6 = [[0, 0]];
        side6 = side6.concat(this.slotLine(side6[side6.length - 1], true, f.width + boxThickness + kerf2, 
            [(f.width) / 2 + kerf], smallSlotNK, slotDepth, false));
        side6 = side6.concat(this.slotLine(side6[side6.length - 1], false, f.height + boxThickness + kerf2, 
                [(f.height) / 4 + boxThickness + kerf, 3 * (f.height) / 4 + boxThickness + kerf], largeSlotNK, slotDepth, false));
        side6.push([0, f.height + boxThickness + kerf2]);
        side6.push([0, 0]);

        sides.push(DrawCuttingTools.pathShift(side6, shift, i * (f.height + boxThickness + space)));

        if (this.debug) {
            side6 = [[kerf, kerf]];
            side6 = side6.concat(this.slotLine(side6[side6.length - 1], true, f.width + boxThickness, 
                [(f.width) / 2], smallSlot, slotDepth, false));
            side6 = side6.concat(this.slotLine(side6[side6.length - 1], false, f.height + boxThickness, 
                    [(f.height) / 4 + boxThickness, 3 * (f.height) / 4 + boxThickness], largeSlot, slotDepth, false));
            side6.push([kerf, f.height + boxThickness + kerf]);
            side6.push([kerf, kerf]);
            sides.push(DrawCuttingTools.pathShift(side6, shift, i * (f.height + boxThickness + space)));
        }

    }

    // TODO the last part of the fastener

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

    var shiftx = (A4width - box.width()) / 2;
    var shifty = (A4height - box.height()) / 2;

    for(var layer of cut) {
        for(var path of layer) {
            // compute relative coordinates
            var shiftPL = DrawCuttingTools.pathAbsoluteToRelative(path);
            
            doc.lines(shiftPL, path[0][0] + shiftx, path[0][1] + shifty);
        }
    }
    
    // add a second page
    doc.addPage();
    doc.setDrawColor("#000000");
    doc.setLineWidth(0.05);


    // draw side cuttings
    cut = this.getSidesCutting(params, 10);
    box = Box.getBoundingBox(cut);

    if (box == null || box.width > A4width || box.height > A4height)
        return null;

    shiftx = (A4width - box.width()) / 2;
    shifty = (A4height - box.height()) / 2;

    for(var layer of cut) {
        for(var path of layer) {
            // compute relative coordinates
            var shiftPL = DrawCuttingTools.pathAbsoluteToRelative(path);
            
            doc.lines(shiftPL, path[0][0] + shiftx, path[0][1] + shifty);
        }
    }

    return doc;
}

Device.prototype.boxDXF = function(params) {
    var Drawing = require('Drawing');
    var d = new Drawing();
    d.setUnits('Millimeters');

    var space = 1;

    var cut = this.getBackCutting(params);
    var box = Box.getBoundingBox(cut);

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
            d.drawPolyline(path);
        }
    }

    // get side cuttings
    cut = this.getSidesCutting(params, space);

    // draw side cuttings
    id = 0;
    for(var layer of cut) {
        if (id != 0) {
            // 8 different colors are defined by js-dxf
            // see Drawing.ACI (Autocad Color Index)
            d.setActiveLayer("l_" + id);
        }
        id += 1;
        for(var path of layer) {
            path = DrawCuttingTools.pathShift(path, box.right + space, 0);
            d.drawPolyline(path);
        }
    }

    return d;
}
