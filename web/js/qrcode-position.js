
class QRCodePosition {
    constructor() {
        this.dataMatrixCell = 1;
        this.dataMatrixNbCells = 10;
        this.dataMatrixWidth = this.dataMatrixNbCells * this.dataMatrixCell;
        this.dataMatrixHeightWithMargins = (2 + this.dataMatrixNbCells) * this.dataMatrixCell;
        this.marginQRCode = 5;

    }

    getBlocWidth() {
        return this.dataMatrixHeightWithMargins;
    }
    getBlocHeight() {
        return this.dataMatrixHeightWithMargins;
    }

}

