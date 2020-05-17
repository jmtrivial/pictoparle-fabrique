
class Pictogram {
    constructor(text, image) {
        this.text = text;
        this.image = image;
    }
}

class PictogramInScreen extends Pictogram {
    constructor(pictogram, width, height, left, top) {
        super(pictogram.text, pictogram.image);
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
    constructor(nbColumns, nbRows, cellWidth, cellHeight) {
        this.nbColumns = nbColumns;
        this.nbRows = nbRows;
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.pictograms = [];
        this.quitButtonRow = null;
        this.quitButtonWidth = null;
        this.quitButtonHeight = null;
        for(var i = 0; i < nbRows; ++i) {
            this.pictograms.push([]);
            for(var j = 0; j < nbColumns; ++j) {
                this.pictograms[this.pictograms.length - 1].push(null);
            }
        }
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
        this.pictograms[x][y] = pictogram;
    }
    deletePictogram(x, y) {
        this.pictograms[x][y] = null;
    }

    isEmpty() {
        for (var r of this.pictograms) {
            for (var p of r) {
                if (p != null)
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
    if (cellWidth == null) cellWidth = 0;
    if (cellHeight == null) cellHeight = 0;
    cellWidth = parseFloat(cellWidth);
    cellHeight = parseFloat(cellHeight);

    var nbRows = xml.getElementsByTagName("row").length;
    var nbColumns = 0;
    for (var row of xml.getElementsByTagName("row")) {
        var nbColumnsLocal = row.getElementsByTagName("pictogram").length;
        if (nbColumnsLocal > nbColumns)
            nbColumns = nbColumnsLocal;
    }
    var result = new BoardPanel(nbColumns, nbRows, cellWidth, cellHeight);
    var idRow = 0;
    for (var i = 0; i < xml.children.length; ++i) {
        if (xml.children[i].nodeName == "row") {
            for(var j = 0; j != xml.children[i].children.length; ++j) {
                if (xml.children[i].children[j].nodeName == "pictogram") {
                    var txt = xml.children[i].children[j].getAttribute("txt");
                    var image = xml.children[i].children[j].getAttribute("image");
                    result.setPictogram(idRow, j, new Pictogram(txt, image));
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

    setName(n) {
        this.name = name;
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
        console.log("no orientation");
        return null;
    }
    
    var result = new Board(name, id, orientation);

    var cellsList = xml.getElementsByTagName("cells");
    for(var cells of cellsList) {
        result.addPanel(BoardPanel.fromXML(cells));
    }

    return result;
}