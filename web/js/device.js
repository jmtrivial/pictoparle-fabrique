

class Device {
    
    constructor(name, id, screen, margins, camera) {
        this.name = name;
        this.id = id;
        this.screen = screen;
        this.margins = margins;
        this.camera = camera;
    }

    getWidth() {
        return this.screen["width"] + this.margins["left"] + this.margins["right"];
    }
    getHeight() {
        return this.screen["height"] + this.margins["top"] + this.margins["bottom"];
    }

    getScreenWidth() {
        return this.screen["width"];
    }
    getScreenHeight() {
        return this.screen["height"];
    }

}

Device.fromXML = function(xml) {
    var xmldevice = xml.getElementsByTagName("device")[0];
    var xmlscreen = xml.getElementsByTagName("screen")[0];
    var xmlmargins = xml.getElementsByTagName("margins")[0];
    var xmlcamera = xml.getElementsByTagName("camera")[0];

    var name = xmldevice.getAttribute("name");
    var id = xmldevice.getAttribute("id");

    var screen = {};
    for (var e of ["width", "height"]) {
        screen[e] = parseFloat(xmlscreen.getAttribute(e));
    }

    var margins = {};
    for (var e of ["left", "right", "top", "bottom", "cornerRadius"]) {
        margins[e] = parseFloat(xmlmargins.getAttribute(e));
    }

    var camera = {};

    for(var e of ["x", "y", "radius"]) {
        camera[e] = parseFloat(xmlcamera.getAttribute(e));
    }

    return new Device(name, id, screen, margins, camera);

}