

class Pictogram {
    constructor(text, image, audio) {
        this.text = text;
        this.image = image;
        this.audio = audio;
    }

    clone() {
        return new Pictogram(this.text, this.image, this.audio);
    }

    isEmpty() {
        return this.text == "" && this.image == "" && this.audio == "";
    }
    toXML() {
        return "<pictogram txt=\"" + this.text + "\" image=\"" + this.image + "\" audio=\"" + this.audio + "\" />\n";
    }
}

class PictogramInScreen extends Pictogram {
    constructor(pictogram, width, height, left, top) {
        super(pictogram.text, pictogram.image, pictogram.audio);
        this.width = width;
        this.height = height;
        this.left = left;
        this.top = top;
    }

}

class QuitButton {
    constructor(width, height, left, top) {
        this.width = width;
        this.height = height;
        this.left = left;
        this.top = top;
    }
}

class BoardPanel {
    constructor(nbColumns, nbRows, cellWidth, cellHeight, padding = 0) {
        this.nbColumns = nbColumns;
        this.nbRows = nbRows;
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.pictograms = [];
        this.quitButtonRow = null;
        this.quitButtonWidth = null;
        this.quitButtonHeight = null;
        this.padding = padding;
        for(var i = 0; i < nbRows; ++i) {
            this.pictograms.push([]);
            for(var j = 0; j < nbColumns; ++j) {
                this.pictograms[this.pictograms.length - 1].push(null);
            }
        }
    }

    clone() {
        var result = new BoardPanel(this.nbColumns, this.nbRows, this.cellWidth, this.cellHeight);
        result.setQuitRow(this.quitButtonRow, this.quitButtonWidth, this.quitButtonHeight);
        for(var i = 0; i < this.nbRows; ++i)
            for(var j = 0; j < this.nbColumns; ++j)
            if (this.pictograms[i][j] != null)
            result.pictograms[i][j] = this.pictograms[i][j].clone();
        return result;
    }

    setPadding(padding) {
        this.padding = padding;
    }
    getPadding() {
        return this.padding;
    }

    toXMLQuitButton() {
        var result = "<quit";
        if (this.quitButtonWidth != null && this.quitButtonWidth != 0) {
            result += " width=\"" + this.quitButtonWidth + "\"";
        }
        if (this.quitButtonHeight != null && this.quitButtonHeight != 0) {
            result += " height=\"" + this.quitButtonHeight + "\"";
        }
        result += " />\n";
        return result;
    }

    toXML() {
        var result = "<cells";
        if (this.cellWidth != 0)
            result += " cellWidth=\"" + this.cellWidth + "\"";
        if (this.cellHeight != 0)
            result += " cellHeight=\"" + this.cellHeight + "\"";
        result += " padding=\"" + this.padding + "\"";
        result += ">\n";
        if (this.nbRows != 0) {
            for(var i = 0; i < this.nbRows; ++i) {
                var row = this.pictograms[this.nbRows - i - 1];
                result += "<row>\n";
                for(var p of row) {
                    result += p.toXML();
                }
                result += "</row>\n";
                if (this.quitButtonRow != null && this.quitButtonRow == i) {
                    result += this.toXMLQuitButton();
                }
            }
        }
        else {
            if (this.quitButtonRow != null) {
                result += this.toXMLQuitButton();
            }
        }

        result += "</cells>";
        return result;
    }

    checkImages(imageList) {
        for (var r of this.pictograms) {
            for (var p of r) {
                if (p != null && p.image != "") {
                    if (!(p.image in imageList)) {
                        console.log("Clear board (unknown image: " + p.image + ")");
                        p.image = "";
                    }
                }
            }
        }

    }

    setQuitRow(r, w, h) {
        this.quitButtonRow = r;
        this.quitButtonWidth = w;
        this.quitButtonHeight = h;
    }

    setPictogram(x, y, pictogram) {
        // invert row ordering
        this.pictograms[this.nbRows - x - 1][y] = pictogram;
    }
    deletePictogram(x, y) {
        this.pictograms[x][y] = null;
    }

    isEmpty() {
        for (var r of this.pictograms) {
            for (var p of r) {
                if (p != null && !p.isEmpty())
                    return false;
            }
        }
        return true;
    }

    computeSpanX(width) {
        if (this.nbColumns == 0)
            return 0;
        else
            return (width - (this.nbColumns * this.cellWidth)) / (this.nbColumns - 1);
    }

    computeSpanY(height) {

        var quit = 0;
        if (this.quitButtonRow != null) {
            if (this.quitButtonRow == this.nbRows && this.quitButtonHeight != null)
                quit = this.quitButtonHeight;
        }

        if (this.nbRows == 0)
            return quit;
        else
            return (height - quit - (this.nbRows * this.cellHeight)) / (this.nbRows - 1);
    
    }

    getPictograms() {
        var result = [];
        for (var r of this.pictograms) {
            result = result.concat(r);
        }
        return result;
    }

    getElementsInScreen(spaceX, spaceY, shiftX, shiftY) {
        var result = [];

        var y = shiftY;
        for (var r of this.pictograms) {
            var x = shiftX;
            for (var p of r) {
                result.push(new PictogramInScreen(p, this.cellWidth, this.cellHeight, x, y));
                x += this.cellWidth + spaceX;
            }
            y += this.cellHeight + spaceY;
        }

        if (this.quitButtonRow != null) {
            var width = spaceX;
            var height = spaceY;
            if (this.quitButtonWidth != null && this.quitButtonWidth != 0) width = this.quitButtonWidth;
            if (this.quitButtonHeight != null && this.quitButtonHeight != 0) height = this.quitButtonHeight;
            result.push(new QuitButton(width, height, shiftX + this.cellWidth, shiftY + this.cellHeight));
        }

        return result;
    }

    computeSize(spaceX, spaceY) {
        var quitY = 0;
        var quitX = 0;
        if (this.quitButtonRow != null) {
            if (this.quitButtonRow == this.nbRows && this.quitButtonHeight != null) {
                quitX = this.quitButtonWidth;
                quitY = this.quitButtonHeight;
            }
        }

        if (this.nbColumns == 0) {
            return { "width": quitX, "height": quitY};
        }
        else 
            return { "width": this.nbColumns * (this.cellWidth + spaceX) - spaceX + quitX,
            "height": this.nbRows * (this.cellHeight + spaceY) - spaceY + quitY };
    }
}

BoardPanel.fromXML = function(xml) {
    var cellWidth = xml.getAttribute("cellWidth");
    var cellHeight = xml.getAttribute("cellHeight");
    var padding = xml.getAttribute("padding");
    if (cellWidth == null) cellWidth = "0";
    if (cellHeight == null) cellHeight = "0";
    if (padding == null) padding = "0";
    cellWidth = parseFloat(cellWidth);
    cellHeight = parseFloat(cellHeight);
    padding = parseFloat(padding);


    var nbRows = xml.getElementsByTagName("row").length;
    var nbColumns = 0;
    for (var row of xml.getElementsByTagName("row")) {
        var nbColumnsLocal = row.getElementsByTagName("pictogram").length;
        if (nbColumnsLocal > nbColumns)
            nbColumns = nbColumnsLocal;
    }
    var result = new BoardPanel(nbColumns, nbRows, cellWidth, cellHeight, padding);
    var idRow = 0;
    for (var i = 0; i < xml.children.length; ++i) {
        if (xml.children[i].nodeName == "row") {
            for(var j = 0; j != xml.children[i].children.length; ++j) {
                if (xml.children[i].children[j].nodeName == "pictogram") {
                    var txt = xml.children[i].children[j].getAttribute("txt");
                    if (txt === undefined || txt == null)
                        txt = "";
                    var image = xml.children[i].children[j].getAttribute("image");
                    if (image === undefined || image == null)
                        image = "";
                    var audio = xml.children[i].children[j].getAttribute("audio");
                    if (audio === undefined || audio == null)
                        audio = "";
                    result.setPictogram(idRow, j, new Pictogram(txt, image, audio));
                }
            }
            idRow += 1;
        }
        else {
            var width = xml.children[i].getAttribute("width");
            if (width != null)
                width = parseFloat(width);
            var height = xml.children[i].getAttribute("height");
            if (height != null)
                height = parseFloat(height);
            result.setQuitRow(idRow, width, height);
        }
    }
    return result;
}

class Board {
    constructor(name, id, orientation) {
        this.orientation = orientation;
        this.name = name;
        this.id = id;
        this.panels = [];

    }

    clone() {
        var result = new Board(this.name, this.id, this.orientation);
        for(var p of this.panels) {
            result.panels.push(p.clone());
        }
        return result;
    }

    setName(n) {
        this.name = name;
    }

    setPadding(padding) {
        for(var p of this.panels)
            p.setPadding(padding);
    }
    getPaddings() {
        return this.panels.map(x => x.getPadding());
    }

    setOrientation(o) {
        this.orientation = o;
    }

    getPanels() {
        return this.panels;
    }

    addPanel(panel) {
        this.panels.push(panel);
    }
    insertPanel(panel, i) {
        this.panels.splice(i, 0, panel);
    }

    isEmpty() {
        for(var p of this.panels)
            if (!p.isEmpty())
                return false;
        return true;
    }

    checkImages(imageList) {
        for(var p of this.panels) {
            p.checkImages(imageList);
        }
    }

    hasImage(image) {
        for(var p of this.panels) {
            var pictos = p.getPictograms();
            for(var pc of pictos) {
                if (pc.image == image)
                    return true;
            }
        }
        return false;
    }

    hasAudio(audio) {
        for(var p of this.panels) {
            var pictos = p.getPictograms();
            for(var pc of pictos) {
                if (pc.audio == audio)
                    return true;
            }
        }
        return false;
    }

    setAudio(pictoID, audio) {
        var i = 0;
        for(var p of this.panels) {
            var pictos = p.getPictograms();
            if (i + pictos.length > pictoID) {
                pictos[pictoID - i].audio = audio;
                return pictos[pictoID - i];
            }
            i += pictos.length;
        }
    }

    setImage(pictoID, image, name) {
        var i = 0;
        for(var p of this.panels) {
            var pictos = p.getPictograms();
            if (i + pictos.length > pictoID) {
                pictos[pictoID - i].image = image;
                if (pictos[pictoID - i].text == "") {
                    pictos[pictoID - i].text = name;
                }
                return pictos[pictoID - i];
            }
            i += pictos.length;
        }
    }

    deleteImage(pictoID) {
        return this.setImage(pictoID, "");
    }

    deleteAudio(pictoID) {
        return this.setAudio(pictoID, "");
    }

    setPictoText(pictoID, text) {
        var i = 0;
        for(var p of this.panels) {
            var pictos = p.getPictograms();
            if (i + pictos.length > pictoID) {
                pictos[pictoID - i].text = text;
                return pictos[pictoID - i];
            }
            i += pictos.length;
        }
    }

    getSizing(pictoID) {
        var i = 0;
        for(var p of this.panels) {
            var pictos = p.getPictograms();
            if (i + pictos.length > pictoID) {
                return { "padding": p.getPadding(), "width": p.cellWidth, "height": p.cellHeight };
            }
            i += pictos.length;
        }
    }

    getImageResizingFromSize(pictoID, size) {
        var sizing = this.getSizing(pictoID);

        var targetSize = [ sizing["width"] - 2 * sizing["padding"], sizing["height"] - 2 * sizing["padding"] ];

        var ratio1 = targetSize[0] / size[0];
        var ratio2 = targetSize[1] / size[1];
        var finalWidth, finalHeight;
        if (ratio1 < ratio2) {
            finalWidth = targetSize[0];
            finalHeight = size[1] * ratio1;
        }
        else {
            finalWidth = size[0] * ratio2;
            finalHeight = targetSize[1];

        }
        return {"width": finalWidth, "height": finalHeight, 
                "top": (sizing["height"] - finalHeight) / 2,
                "left": (sizing["width"] - finalWidth) / 2};

    }

    boardCutting(device, buffer) {

        var result = [];

        var f = new Fastener();
        var qrp = new QRCodePosition();
        var marginQRCode = qrp.marginQRCode;

        var screenShiftV = device.margins["bottom"] + buffer;
        var screenShiftH = f.width + device.margins["left"] + buffer;
        var holesLayer = [];
        // draw each pictogram window
        for(var p of this.getElementsInScreen(device)) {
            if (p instanceof PictogramInScreen) {
                var cornerx = screenShiftV + device.getScreenHeight() - p.top - p.height;
                var cornery = screenShiftH + device.getScreenWidth() - p.left - p.width;
                var box = new Box(cornerx, cornerx + p.height, cornery, cornery + p.width);
                holesLayer.push(box.toPolyline());
            }
        }
        result.push(holesLayer);

        var height = device.getHeight() + 2 * buffer;
        var width = device.getWidth() + 2 * f.width + 2 * buffer;
        var topShift = qrp.getTopShiftFromScreen(device) - buffer + device.margins["bottom"] + marginQRCode + device.getScreenHeight();
        if (topShift < height)
            topShift = height;
        var leftShift = qrp.getLeftShiftFromScreen(device) + buffer + device.margins["left"] + 
                            f.width - marginQRCode;

        var widthQRCodeFrame = marginQRCode * 2 + qrp.dataMatrixHeightWithMargins;

        var board = [];

        board = board.concat(DrawCuttingTools.invertXY(f.shape(0)));
        board = board.concat([[height, 0], // first side of the tablet (+ fastener)
                    [height, leftShift], [topShift, leftShift], // first side of the QRCode frame
                    [topShift, leftShift + widthQRCodeFrame], [height, leftShift + widthQRCodeFrame], // second side of the QRCode frame
                    [height, width]]);
        var fastener = DrawCuttingTools.pathShift(DrawCuttingTools.pathInvertY(DrawCuttingTools.invertXY(f.shape(0))), 0, width);
        fastener.reverse();
        board = board.concat(fastener);
        board.push(board[0]); // close shape

        result.push([board]);

        return result;
    }


    cuttingPDF(device, buffer, scale) {
        var A4width = 210;
        var A4height = 297;

        var doc = new jsPDF();
        doc.setDrawColor("#000000");
        doc.setLineWidth(0.05);

        var cut = this.boardCutting(device, buffer);
        var box = Box.getBoundingBox(cut);

        if (box == null || box.width * scale > A4width || box.height * scale > A4height)
            return null;

        var shiftx = (A4width - box.width() * scale) / 2;
        var shifty = (A4height - box.height() * scale) / 2;

        for(var layer of cut) {
            for(var path of layer) {
                // compute relative coordinates
                var shiftPL = DrawCuttingTools.pathAbsoluteToRelative(DrawCuttingTools.scale(path, scale));
                
                doc.lines(shiftPL, path[0][0] * scale + shiftx, path[0][1] * scale + shifty);
            }
        }

        return doc;
    }

    cuttingDXF(device, buffer) {
        var Drawing = require('Drawing');
        var d = new Drawing();
        d.setUnits('Millimeters');


        var cut = this.boardCutting(device, buffer);
        var middle = Box.getBoundingBox(cut).center();
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
                path = DrawCuttingTools.pathSymmetryX(path, middle[0]);
                d.drawPolyline(path);
            }
        }

        return d;
    }



    toPDF(device, scale, imageSizes) {
        var A4width = 210;
        var A4height = 297;
        var margins = 10;

        var marginForCutting = 5;

        if (A4width - 2 * margins < device.getScreenHeight() ||
            A4height - 2 * margins < device.getScreenWidth())
            return null;

        // According to jsPDF documentation, 
        // default export is a4 paper, portrait, using millimeters for units
        var doc = new jsPDF();

        var radiusBlackRectangle = 2 * device.camera["radius"];


        var offsetX = (A4width - (device.getScreenHeight() + device.camera["y"] + radiusBlackRectangle + 2 * marginForCutting) * scale) / 2 + (device.camera["y"] + radiusBlackRectangle + marginForCutting) * scale;
        var offsetY = (A4height - (device.getScreenWidth() + 2 * marginForCutting) * scale) / 2 - marginForCutting * scale;

        doc.setDrawColor("#CC88FF");
        doc.setFontSize(7 * scale);
        doc.setTextColor("#CC88FF");

        // draw pictograms
        var i = 0;
        for(var p of this.getElementsInScreen(device)) {
            if (p instanceof PictogramInScreen) {
                if (p.image != "") {
                    var img = window.images[p.image];
                    var sizing = this.getImageResizingFromSize(i, imageSizes[p.image]);
                    doc.addImage(img, offsetX + (p.top + sizing["height"] + sizing["top"]) * scale, 
                                    offsetY + (device.getScreenWidth() - (p.left + sizing["height"]) - sizing["left"]) * scale,
                                    sizing["width"] * scale, sizing["height"] * scale, p.text, 'NONE', 90);
                    doc.rect(offsetX + p.top * scale, offsetY + (device.getScreenWidth() - p.left - p.width) * scale, p.height * scale, p.width * scale);
                    doc.text(p.text, offsetX + (p.top + p.height + 2) * scale, offsetY + (device.getScreenWidth() - p.left) * scale, { "angle": 90});
                }
                i += 1;
            }
        }
        
        // draw screen border
        doc.rect(offsetX, offsetY, device.getScreenHeight() * scale, device.getScreenWidth() * scale);
        
        // draw the camera+QRcode bloc 
        var qrp = new QRCodePosition();
        var topShiftBloc = device.camera["y"] + 2 * device.camera["radius"];
        var leftShiftBloc = device.getScreenWidth() / 2 + device.camera["x"] - qrp.dataMatrixHeightWithMargins / 2;

        doc.lines(
            DrawCuttingTools.scale([[2 * device.camera["radius"] + qrp.dataMatrixCell * 2, 0],
                [0, qrp.dataMatrixHeightWithMargins],
                [-(2 * device.camera["radius"] + qrp.dataMatrixCell * 2), 0]
            ], scale),
            offsetX - topShiftBloc * scale, offsetY + leftShiftBloc * scale);

        doc.setLineDashPattern([2, 2], 0);
        doc.lines(
            DrawCuttingTools.scale([[2 * marginForCutting + device.getScreenHeight(), 0],
                                    [0, 2 * marginForCutting + device.getScreenWidth()],
                                    [-(2 * marginForCutting + device.getScreenHeight()), 0],
                                    [0, -(leftShiftBloc)],
                                    [-(2 * device.camera["radius"] + qrp.dataMatrixCell+ marginForCutting), 0],
                                    [0, -(qrp.dataMatrixHeightWithMargins + 2 * marginForCutting)],
                                    [2 * device.camera["radius"] + qrp.dataMatrixCell + marginForCutting, 0],
                                    [0, -(leftShiftBloc)]

            ], scale), 
            offsetX - marginForCutting * scale, offsetY - marginForCutting * scale);
        doc.setLineDashPattern();

        // camera bloc

        doc.setFillColor("#CC88FF");
        doc.rect(offsetX - (device.camera["y"] + radiusBlackRectangle) * scale, 
                 offsetY + (device.getScreenWidth() / 2 + device.camera["x"] - radiusBlackRectangle) * scale,
                 2 * radiusBlackRectangle * scale, 2 * radiusBlackRectangle * scale, 'F');

        doc.setFontSize(12 * scale);
        doc.text('Planche «' + this.name + '» côté pictogrammes, pour thermogonflage', 10, 10);
        doc.setFontSize(8 * scale);
        doc.text('Après impression et thermogonflage, découper suivant les pointillés', 10, 14);

        // create a new page for the verso side
        doc.addPage();


        offsetX = (A4width - qrp.getBlocHeight() * scale) / 2;
        offsetY = (A4height - qrp.getBlocWidth(device) * scale) / 2;

        // draw black rectangle for the camera
        doc.setFillColor("#000000");
        doc.rect(offsetX + (qrp.getBlocWidth(device) - radiusBlackRectangle - 2 * qrp.dataMatrixCell) * scale, 
                 offsetY + (qrp.getBlocHeight() / 2 - radiusBlackRectangle) * scale,
                 2 * radiusBlackRectangle * scale, 2 * radiusBlackRectangle * scale, 'F');

        // draw line arround camera and datamatrix
        doc.rect(offsetX, 
                 offsetY,
                 qrp.getBlocWidth(device) * scale, 
                 qrp.getBlocHeight() * scale);
        
        doc.setLineDashPattern([2, 2], 0);
        doc.rect(offsetX - marginForCutting * scale, 
            offsetY - marginForCutting * scale,
            (qrp.getBlocWidth(device) + 2 * marginForCutting) * scale, 
            (qrp.getBlocHeight() + 2 * marginForCutting) * scale);
       doc.setLineDashPattern();

        doc.addImage($("#qrcode").attr("src"), offsetX + (qrp.dataMatrixCell) * scale, 
                    offsetY + (qrp.dataMatrixCell) * scale,
                    qrp.dataMatrixWidth * scale, qrp.dataMatrixWidth * scale, 'NONE', 0);

        doc.text("ID: " + this.id, offsetX - marginForCutting * scale + 1, offsetY - 1);
        
        doc.setFontSize(12 * scale);
        doc.text('Planche «' + this.name + '» côté QRcode, pour impression simple', 10, 10);
        doc.setFontSize(8 * scale);
        doc.text('Après impression, découper suivant les pointillés', 10, 14);

        return doc;
    }

    toXML() {
        var result ="<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
        result += "<board orientation=\"";
        if (this.orientation == "horizontal") result += "horizontal";
        else result += "vertical";
        result += "\" name=\"" + this.name.replace(/\"/g, "&quot;") +"\" id=\"" + this.id + "\">\n";

        for(var p of this.panels) {
            result += p.toXML();
        }

        result += "</board>\n";

        return result;
    }

    getElementsInScreen(device) {
        if (this.panels.length == 0) {
            return [];
        }
        else if (this.panels.length == 1) {
            var spaceX = this.panels[0].computeSpanX(device.getScreenWidth());
            var spaceY = this.panels[0].computeSpanY(device.getScreenHeight());

            return this.panels[0].getElementsInScreen(spaceX, spaceY, 0, 0);
        }
        else {
            // in each panel
            var innerSpacings = [];
            var sizes = [];
            for(var p of this.panels) {
                // compute the space between pixels
                var spacing;
                if (this.orientation == "horizontal") {
                    spacing = p.computeSpanY(device.getScreenHeight());
                }
                else {
                    spacing = p.computeSpanX(device.getScreenWidth());
                }
                innerSpacings.push(spacing);

                // compute the size of each panel
                sizes.push(p.computeSize(spacing, spacing));
            }

            // compute space between panels
            var interPanels;
            if (this.orientation == "horizontal")
                interPanels = device.getScreenWidth();
            else
                interPanels = device.getScreenHeight();
            for(var s of sizes) {
                if (this.orientation == "horizontal")
                    interPanels -= s["width"];
                else
                    interPanels -= s["height"];
            }
            interPanels /= this.panels.length - 1;

            // build a list of all pictograms in screen
            var result = [];
            var shiftx = 0;
            var shifty = 0;
            for(var i = 0; i != this.panels.length; ++i) {
                var panel = this.panels[i];
                var spacing = innerSpacings[i];
                var size = sizes[i];
                result = result.concat(panel.getElementsInScreen(spacing, spacing, shiftx, shifty));
                if (this.orientation == "horizontal") {
                    shiftx += size["width"] + interPanels;
                }
                else {
                    shifty += size["height"] + interPanels;
                }
            }

            return result;
        }
    }
}

Board.fromXML = function(xml) {
    var boardList = xml.getElementsByTagName("board");
    if (boardList.length == 0) {
        console.log("no board in the XML file");
        return null;
    }
    var board = boardList[0];
    var name = board.getAttribute("name");
    var id = board.getAttribute("id");
    var orientation = board.getAttribute("orientation");
    if ((name == null) || (name == ""))
        name = "";
    if ((orientation == null) || (orientation == "")) {
        orientation = "horizontal";
    }
    
    var result = new Board(name, id, orientation);

    var cellsList = xml.getElementsByTagName("cells");
    for(var cells of cellsList) {
        result.addPanel(BoardPanel.fromXML(cells));
    }

    return result;
}