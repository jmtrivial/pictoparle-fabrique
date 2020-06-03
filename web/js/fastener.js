
class Fastener {
    constructor() {
        this.width = 15;
        this.height = 50;
        this.slot = 10;
        this.blocHeight = 15;
    }

    shape(gap) {
        var path = [[this.width - gap, 0]];
        if (gap != 0)
            path.push([this.width - this.slot - gap, this.height - this.blocHeight - gap]);
        path.push([this.width - this.slot - gap, this.height - this.blocHeight + gap]);
        path.push([this.width - gap, this.height - this.blocHeight + gap]);
        path.push([this.width - gap, this.height - gap]);
        if (gap == 0)
            path.push([0, this.height]);
        return path;
    }
};

