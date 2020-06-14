
class Fastener {
    constructor() {
        this.width = 15;
        this.height = 90;
        this.angled = 40;
        this.slot = 10;
        this.blocHeight = 15;
    }

    shape(gap, kerf = 0, simple = false) {
        var path = [[this.width + 2 * kerf - gap, 0]];
        path.push([this.width - this.slot - gap + 2 * kerf, this.angled - gap + 2 * kerf]);

        if (!simple) {
            path.push([this.width - this.slot - gap + 2 * kerf, this.height - this.blocHeight + gap]);
            path.push([this.width - gap + 2 * kerf, this.height - this.blocHeight + gap]);
            path.push([this.width - gap + 2 * kerf, this.height - gap + 2 * kerf]);
        }
        else {
            path.push([this.width - this.slot - gap + 2 * kerf, this.height  - gap + 2 * kerf]);
        }
        if (gap == 0)
            path.push([0, this.height + 2 * kerf]);
        return path;
    }
};

