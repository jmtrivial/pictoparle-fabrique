
class QRCodePosition {
    constructor() {
        this.dataMatrixCell = 1;
        this.dataMatrixNbCells = 10;
        this.dataMatrixWidth = this.dataMatrixNbCells * this.dataMatrixCell;
        this.dataMatrixHeightWithMargins = (2 + this.dataMatrixNbCells) * this.dataMatrixCell;
        this.marginQRCode = 5;

        this.fullShaderHeight = this.dataMatrixWidth * 1.5 * 2;
        this.fullShaderWidth = this.fullShaderHeight * 16 / 10;

    }

    getBlocWidth() {
        return this.dataMatrixHeightWithMargins;
    }
    getBlocHeight() {
        return this.dataMatrixHeightWithMargins;
    }

    getShaderSize() {
        return this.fullShaderWidth;
    }

    getShaderWidth(device) {
        var shift = Board.marginForCutting;
        var marginTop = device.margins["top"];
        return this.fullShaderHeight - marginTop + shift;
    }

}

