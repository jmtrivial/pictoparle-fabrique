
class Pictogram {
    constructor(text, image) {
        this.text = text;
        this.image = image;
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
        for(var i = 0; i < nbRows; ++i) {
            this.pictograms.push([]);
            for(var j = 0; j < nbColumns; ++j) {
                this.pictograms[this.pictograms.length - 1].push(null);
            }
        }
    }

    setQuitRow(r) {
        this.quitButtonRow = r;
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
}

BoardPanel.fromXML = function(xml) {
    var cellWidth = xml.getAttribute("cellWidth");
    var cellHeight = xml.getAttribute("cellHeight");

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
            result.setQuitRow(idRow);
        }
    }
    return result;
}

class Board {
    constructor(name, orientation) {
        this.orientation = orientation;
        this.name = name;
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


}

Board.fromXML = function(xml) {
    var boardList = xml.getElementsByTagName("board");
    if (boardList.length == 0) {
        console.log("no board in the XML file");
        return null;
    }
    var board = boardList[0];
    var name = board.getAttribute("name");
    var orientation = board.getAttribute("orientation");
    if ((name == null) || (name == "") || (orientation == null) || (orientation == "")) {
        console.log("no name or orientation");
        return null;
    }
    
    var result = new Board(name, orientation);

    var cellsList = xml.getElementsByTagName("cells");
    for(var cells of cellsList) {
        result.addPanel(BoardPanel.fromXML(cells));
    }

    return result;
}