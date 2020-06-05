
class Fastener {
    constructor() {
        this.width = 15;
        this.height = 50;
        this.slot = 10;
        this.blocHeight = 15;
    }

    shape(gap, kerf = 0) {
        var path = [[this.width + 2 * kerf, 0]];
        if (gap != 0)
            path.push([this.width - this.slot - gap + 2 * kerf, this.height - this.blocHeight - gap + 2 * kerf]);
        path.push([this.width - this.slot - gap + 2 * kerf, this.height - this.blocHeight + gap]);
        path.push([this.width - gap + 2 * kerf, this.height - this.blocHeight + gap]);
        path.push([this.width - gap + 2 * kerf, this.height - gap + 2 * kerf]);
        if (gap == 0)
            path.push([0, this.height + 2 * kerf]);
        return path;
    }
};

