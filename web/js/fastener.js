
class Fastener {
    constructor() {
        this.width = 15;
        this.height = 50;
        this.slot = 10;
        this.blocHeight = 15;
        this.shiftAngle = 2;
    }

    shape(gap) {
        var path = [[this.width, 0]];
        if (gap)
            path.push([this.width - this.slot, this.height - this.blocHeight - this.shiftAngle]);
        path.push([this.width - this.slot, this.height - this.blocHeight]);
        path.push([this.width, this.height - this.blocHeight]);
        path.push([this.width, this.height]);
        path.push([0, this.height]);
        return path;
    }
};

