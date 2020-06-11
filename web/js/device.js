

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

Device.fromXML = function(xml) {
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
        if (["top", "bottom"].includes(window["side"]) && (! ("top" in window))) {
            window["top"] = thickness;
        }

        windows.push(window);
    }

    return new Device(name, id, screen, margins, thickness, camera, windows);

}

Device.prototype.getWindowsBySide = function(side) {
    return this.windows.filter(w => w["side"] == side);
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
Device.prototype.autoSlotLine = function (start, xDirection, length, shiftSlotSection, lengthSlotSection, depthSlots, sideSlots, kerf) {
    var slots = this.autoSlots(lengthSlotSection, shiftSlotSection, depthSlots, sideSlots, kerf);
    return this.slotLine(start, xDirection, length, slots);
}

Device.prototype.slotLine = function(start, xDirection, length, slots) {
    var result = [];

    // compute orientation
    var sign = 1;
    if (length < 0) sign = -1;


    // add slots
    for(var slot of slots) {
        var sSlot = slot["start"];
        var eSlot = slot["end"];

        // compute slot orientation
        var signSlot = sign;
        if (slot["side"])
            signSlot *= -1;
        var slotDepth = slot["depth"];

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


    var back = [];

    // create the contour

    var cBack = [[0, 0]];
    // first fastener
    cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], true, f.height + kerf2, 0, f.height, slotDepth, true, kerf));
    cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, f.width - slotDepth, 0, f.width - slotDepth, slotDepth, true, kerf));

    // upper part
    cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], true, innerSize[1] - f.height, -2 * kerf, innerSize[1] - f.height, slotDepth, true, kerf));
    cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, innerSize[0] + 2 * kerf, 0, innerSize[0], slotDepth, true, kerf));
    cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], true, -(innerSize[1] - f.height), 0, innerSize[1] - f.height, slotDepth, true, kerf));

    // second fastener
    cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, f.width - slotDepth, -kerf, f.width - slotDepth - 2 * kerf, slotDepth, true, kerf));
    cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], true, -(f.height + kerf2), 0, f.height, slotDepth, true, kerf));

    // close shape
    cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, -(2 * (f.width - slotDepth) + innerSize[0] + kerf2), - slotDepth, 2 * f.width + innerSize[0], slotDepth, true, kerf));


    back.push(cBack);




    if (this.debug) {
        // draw the inner shape (without kerf) to check if the drawing is correct

        cBack = [[kerf, kerf]];
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], true, f.height, 0, f.height, slotDepth, true, 0));
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, f.width - slotDepth, 0, f.width - slotDepth, slotDepth, true, 0));

        // upper part
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], true, innerSize[1] - f.height, 0, innerSize[1] - f.height, slotDepth, true, 0));
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, innerSize[0], 0, innerSize[0], slotDepth, true, 0));
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], true, -(innerSize[1] - f.height), 0, innerSize[1] - f.height, slotDepth, true, 0));

        // second fastener
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, f.width - slotDepth, 0, f.width - slotDepth, slotDepth, true, 0));
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], true, -f.height, 0, f.height, slotDepth, true, 0));

        // close shape
        cBack = cBack.concat(this.autoSlotLine(cBack[cBack.length - 1], false, -(2 * (f.width - slotDepth) + innerSize[0]), - slotDepth, 2 * f.width + innerSize[0], slotDepth, true, 0));
        
        back.push(cBack);
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

Device.prototype.rectangleWithSlots = function(width, height, kerf, slots1, slots2, slots3, slots4) {
    var result = [[0, 0]];
    var kerf2 = kerf * 2;

    result = result.concat(this.slotLine(result[result.length - 1], true, width + kerf2, slots1));
    result = result.concat(this.slotLine(result[result.length - 1], false, height + kerf2, slots2));
    result = result.concat(this.slotLine(result[result.length - 1], true, -(width + kerf2), slots3));
    result = result.concat(this.slotLine(result[result.length - 1], false, -(height + kerf2), slots4));

    return result;
}

Device.prototype.autoSlots = function(length, shift, depth, side, kerf) {
    var largeSlot = 10;
    var smallSlot = 4;
    if (side) {
        largeSlot += 2 * kerf;
        smallSlot += 2 * kerf;
    }
    else {
        largeSlot -= 2 * kerf;
        smallSlot -= 2 * kerf;
    }

    var lshift = shift + kerf;

    if (length < smallSlot * 1.5) {
        return [];
    }
    else if (length < smallSlot * 2) {
        return [ { "start": lshift + length - smallSlot, "end": lshift + length,  "depth": depth, "side": side} ];
    }
    else if (length < smallSlot * 4) {
        return [ { "start": lshift + length / 2 - smallSlot / 2, "end": lshift + length / 2 + smallSlot / 2,  "depth": depth, "side": side} ];
    }
    else if (length < largeSlot * 2) {
        return [ { "start": lshift + length / 4 - smallSlot / 2, "end": lshift + length / 4 + smallSlot / 2,  "depth": depth, "side": side},
                 { "start": lshift + 3 * length / 4 - smallSlot / 2, "end": lshift + 3 * length / 4 + smallSlot / 2,  "depth": depth, "side": side}
        ];
    }
    else if (length < largeSlot * 4) {
        return [ { "start": lshift + length / 2 - largeSlot / 2, "end": lshift + length / 2 + largeSlot / 2,  "depth": depth, "side": side} ];
    }
    else {
        return [ { "start": lshift + length / 4 - largeSlot / 2, "end": lshift + length / 4 + largeSlot / 2,  "depth": depth, "side": side},
                 { "start": lshift + 3 * length / 4 - largeSlot / 2, "end": lshift + 3 * length / 4 + largeSlot / 2,  "depth": depth, "side": side}
        ];
    }
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

    // bottom side
    sides.push(this.rectangleWithSlots(deviceThickness + 2 * boardThickness, innerSize[0] + 2 * f.width, kerf,
                                this.autoSlots(deviceThickness, 2 * boxThickness, slotDepth, false, kerf),
                                this.autoSlots(innerSize[0] + 2 * f.width, 0, slotDepth, false, kerf),
                                this.autoSlots(deviceThickness, 0, slotDepth, false, kerf),
                                []));



    if (this.debug) {
        sides.push(DrawCuttingTools.pathShift(
            this.rectangleWithSlots(deviceThickness + 2 * boardThickness, innerSize[0] + 2 * f.width, 0,
            this.autoSlots(deviceThickness, 2 * boxThickness, slotDepth, false, 0),
            this.autoSlots(innerSize[0] + 2 * f.width, 0, slotDepth, false, 0),
            this.autoSlots(deviceThickness, 0, slotDepth, false, 0),
            []), kerf, kerf
            ));       
    }
        

    var shift = deviceThickness + boxThickness + boardThickness + space;
    
    // sides of the fasteners
    for(var i = 0; i != 2; ++i) {
        sides.push(DrawCuttingTools.pathShift(
                        this.rectangleWithSlots(deviceThickness, f.height + boxThickness, kerf,
                                this.autoSlots(deviceThickness, 0, slotDepth, true, kerf),
                                this.autoSlots(f.height, 0, slotDepth, false, kerf),
                                this.autoSlots(deviceThickness, 0, slotDepth, false, kerf),
                                this.autoSlots(f.height, boardThickness, slotDepth * 2, true, kerf)),
                                shift + 2 * boxThickness, i * (f.height + 2 * boxThickness + space)));

        if (this.debug) {
            sides.push(DrawCuttingTools.pathShift(
                this.rectangleWithSlots(deviceThickness, f.height + boxThickness, 0,
                        this.autoSlots(deviceThickness, 0, slotDepth, true, 0),
                        this.autoSlots(f.height, 0, slotDepth, false, 0),
                        this.autoSlots(deviceThickness, 0, slotDepth, false, 0),
                        this.autoSlots(f.height, boardThickness, slotDepth * 2, true, 0)),
                        shift + 2 * boxThickness + kerf, i * (f.height + 2 * boxThickness + space) + kerf));
        }

        sides.push(DrawCuttingTools.pathShift(
            this.rectangleWithSlots(deviceThickness, f.width - boxThickness, kerf,
                    this.autoSlots(deviceThickness, 0, slotDepth, true, kerf),
                    this.autoSlots(f.width - boxThickness, 0, slotDepth, false, kerf),
                    this.autoSlots(deviceThickness, 0, slotDepth, false, kerf),
                    this.autoSlots(f.width - boxThickness, 0, slotDepth, true, kerf)),
                    shift + 2 * boxThickness, (f.height + 2 * boxThickness + space) * 2 + slotDepth + i * (f.width + 2 * kerf + 2 * space)));        

        if (this.debug) {
            sides.push(DrawCuttingTools.pathShift(
                this.rectangleWithSlots(deviceThickness, f.width - boxThickness, 0,
                        this.autoSlots(deviceThickness, 0, slotDepth, true, 0),
                        this.autoSlots(f.width - boxThickness, 0, slotDepth, false, 0),
                        this.autoSlots(deviceThickness, 0, slotDepth, false, 0),
                        this.autoSlots(f.width - boxThickness, 0, slotDepth, true, 0)),
                        shift + 2 * boxThickness + kerf, (f.height + 2 * boxThickness + space) * 2 + slotDepth + i * (f.width + 2 * kerf + 2 * space) + kerf));        
            }

    }

    shift += deviceThickness + 2 * boxThickness + space;

    // sides of the board
    for(var i = 0; i != 2; ++i) {

        sides.push(DrawCuttingTools.pathShift(
            this.rectangleWithSlots(deviceThickness + boxThickness, innerSize[1] - f.height, kerf,
                    this.autoSlots(deviceThickness, boxThickness, slotDepth, true, kerf),
                    this.autoSlots(innerSize[1] - f.height, -boxThickness, slotDepth, false, kerf),
                    this.autoSlots(deviceThickness + boxThickness, 0, slotDepth, false, kerf),
                    []),
                    shift, i * ((innerSize[1] - f.height) + space + boxThickness)));  

        if (this.debug) {
            sides.push(DrawCuttingTools.pathShift(
                this.rectangleWithSlots(deviceThickness + boxThickness, innerSize[1] - f.height, 0,
                        this.autoSlots(deviceThickness, boxThickness, slotDepth, true, 0),
                        this.autoSlots(innerSize[1] - f.height, -boxThickness, slotDepth, false, 0),
                        this.autoSlots(deviceThickness + boxThickness, 0, slotDepth, false, 0),
                        []),
                        shift + kerf, i * ((innerSize[1] - f.height) + space + boxThickness) + kerf));  
            }
    }

    shift += deviceThickness + boxThickness + space;

    var qp = new QRCodePosition();
    var widthQRCode = qp.dataMatrixHeightWithMargins + 4 * qp.marginQRCode;

    // upper side
    sides.push(DrawCuttingTools.pathShift(
        this.rectangleWithSlots(deviceThickness + boxThickness + boardThickness, innerSize[0], kerf,
                this.autoSlots(deviceThickness + boxThickness, boardThickness, slotDepth, true, kerf),
                this.autoSlots(innerSize[0], 0, slotDepth, false, kerf),
                this.autoSlots(deviceThickness + boxThickness, 0, slotDepth, true, kerf),
                [{ "start": innerSize[0] / 2 - (widthQRCode) / 2 + 2 * kerf, 
                    "end": innerSize[0] / 2 + (widthQRCode) / 2, "side": false, "depth": slotDepth }]),
                shift, 0));

    if (this.debug) {
        sides.push(DrawCuttingTools.pathShift(
            this.rectangleWithSlots(deviceThickness + boxThickness + boardThickness, innerSize[0], 0,
                    this.autoSlots(deviceThickness + boxThickness, boardThickness, slotDepth, true, 0),
                    this.autoSlots(innerSize[0], 0, slotDepth, false, 0),
                    this.autoSlots(deviceThickness + boxThickness, 0, slotDepth, true, 0),
                    [{ "start": innerSize[0] / 2 - (widthQRCode) / 2, 
                        "end": innerSize[0] / 2 + (widthQRCode) / 2, "side": false, "depth": slotDepth }]),
                    shift + kerf,  kerf));
    }

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
        sides.push(DrawCuttingTools.pathShift(
            this.rectangleWithSlots(f.width, f.height + boxThickness, kerf,
                    this.autoSlots(f.width - slotDepth, 0, slotDepth, false, kerf),
                    this.autoSlots(f.height, boxThickness, slotDepth, false, kerf),
                    [],
                    []),
                        shift, i * (f.height + boxThickness + space)));
        
        if (this.debug) {
            sides.push(DrawCuttingTools.pathShift(
                this.rectangleWithSlots(f.width, f.height + boxThickness, 0,
                this.autoSlots(f.width - slotDepth, 0, slotDepth, false, 0),
                this.autoSlots(f.height, boxThickness, slotDepth, false, 0),
                [],
                []),
                    shift + kerf, i * (f.height + boxThickness + space) + kerf));
        }

    }

    shift += f.width + space;

    // the last part of the fasteners
    for(var i = 0; i != 2; ++i) {
        var gap = 0.5;
        var side7 = f.shape(gap, kerf);
        side7.push([0, f.height - gap + 2 * kerf]);
        side7 = side7.concat(this.autoSlotLine(side7[side7.length - 1], false, -f.height + gap - 2 * kerf, -gap, f.height, slotDepth, false, kerf));
        side7.push(side7[0]);
            
        sides.push(DrawCuttingTools.pathShift(side7, shift, (f.height + boxThickness + space) * i));   

        if (this.debug) {
            side7 = f.shape(gap, 0);
            side7.push([0, f.height - gap]);
            side7 = side7.concat(this.autoSlotLine(side7[side7.length - 1], false, -f.height + gap, -gap, f.height, slotDepth, false, 0));
            side7.push(side7[0]);
                
            sides.push(DrawCuttingTools.pathShift(side7, shift + kerf, (f.height + boxThickness + space) * i + kerf));   
        }
    }

    cuttings.push(innerCuts);
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
    doc.setLineWidth(0.05);


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
            path = DrawCuttingTools.pathShift(path, box.right + space, 0);
            d.drawPolyline(path);
        }
    }

    return d;
}
