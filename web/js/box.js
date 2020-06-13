
/** 
 ** 
 ** class Box: a 2D bounding box 
 **  
 **  
 **/
class Box {
    constructor(left, right, top, bottom) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }
    
    width() {
        return this.right - this.left;
    }
    height() {
        return this.bottom - this.top;
    }

};

Box.prototype.center = function() {
    return [(this.left + this.right) / 2, (this.bottom + this.top) / 2];
}


Box.prototype.toPolyline = function() {
    return [ [this.left, this.top],
             [this.right, this.top],
             [this.right, this.bottom],
             [this.left, this.bottom],
             [this.left, this.top]];
}

Box.prototype.addPoint = function(point) {
    if (point[0] < this.left) this.left = point[0];
    if (point[1] < this.top) this.top = point[1];
    if (point[0] > this.right) this.right = point[0];
    if (point[1] > this.bottom) this.bottom = point[1];
}

Box.prototype.add = function(llpath) {
    if (typeof llpath == "number") {
        return;
    }
    else if (typeof llpath[0] == "number") {
        this.addPoint(llpath);
    }
    else {
        for(var e of llpath) {
            this.add(e);
        }
    }
}

Box.fromPoint = function(point) {
    return new Box(point[0], point[0], point[1], point[1]);
};

Box.getBoundingBox = function(llpath) {
    if (typeof llpath == "number" || llpath.length == 0) {
        return null;
    }
    else if (typeof llpath[0] == "number") {
        return Box.fromPoint(llpath);
    }
    else {
        var box = null;
        
        for(var e of llpath) {
            if (box == null) {
                box = Box.getBoundingBox(e);
            }
            else {
                box.add(e);
            }
        }
        return box;
    }
}

