
class QRCodePosition {
    constructor() {
        this.dataMatrixCell = 3;
        this.dataMatrixNbCells = 10;
        this.dataMatrixWidth = this.dataMatrixNbCells * this.dataMatrixCell;
        this.dataMatrixHeightWithMargins = (2 + this.dataMatrixNbCells) * this.dataMatrixCell;
        this.marginQRCode = 5;

    }

    getBlocWidth(device) {
        return 2 * device.camera["radius"] + this.dataMatrixHeightWithMargins + 2 * this.dataMatrixCell;
    }
    getBlocHeight() {
        return this.dataMatrixHeightWithMargins;
    }

    getTopShiftFromScreen (device) {
        return device.camera["y"] + 2 * device.camera["radius"] + this.dataMatrixHeightWithMargins;
    }

    getLeftShiftFromScreen (device) {
        return device.getScreenWidth() / 2 + device.camera["x"] - this.dataMatrixHeightWithMargins / 2;
    }
}

