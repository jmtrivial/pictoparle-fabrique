

$(document).ready(function () {
    $("#inputFile").on("change", handleFileSelect);

    window.board = null;
    window.device = null;

    setTemplateMenu();
    setDeviceMenu();
});

function setDeviceMenu() {
    window.devices = {};

    var deviceIDs = ['lenovo-tab-e10'];

    for(var d of deviceIDs) {
        $.get("devices/" + d + ".xml?uniq=" + uniqID(), function(data) {
            var xml = $(data);              
            // load the template
            var device = Device.fromXML(data);
            window.devices[device.id] = device;              

            // create the entry 
            $("#devices").append("<a class=\"dropdown-item\" href=\"#\" id=\"" + device.id + "\">" + 
                    window.devices[device.id].name + "</a>");

            // set the interaction
            $("#" + d).click(function () {
                window.device = window.devices[this.id];
                updateInterface();
            });

            // set default device
            if (window.device == null) {
                window.device = window.devices[device.id];
                updateInterface();
            }
          });

    }

}

function uniqID() {
    return Math.floor(Math.random() * 1000000);
}


function setTemplateMenu() {
    window.templates = {};

    var templatesIDs = ["3x3-fixedright", "4x3"];
    for (var t of templatesIDs) {
        $.get("templates/" + t + ".xml?uniq=" + uniqID(), function(data) {
            var xml = $(data);              
            // load the template
            var board = Board.fromXML(data);              
            window.templates[board.id] = board;

            // create the entry 
            $("#templates").append("<a class=\"dropdown-item\" href=\"#\" id=\"" + board.id + "\">" + 
                    window.templates[board.id].name + "</a>");

            // set the interaction
            $("#" + board.id).click(function () {
                if (window.board != null && !window.board.isEmpty()) {
                    // TODO: first ask if the user wants to reset his work
                }
                window.board = window.templates[this.id];
                updateInterface();
            });

            // set default device
            if (window.board == null) {
                window.board = window.templates[board.id];
                updateInterface();
            }
            
          });

    }
}

function handleFileSelect(evt) {
    var file = evt.target.files[0];

    if (file.type != "application/zip" && file.type != "application/xml" && file.type != "text/xml") {
        console.log("bad format");
        // TODO: add a message to the user
        return;
    }

    var readerString = new FileReader();

    // Closure to capture the file information.
    readerString.onload = (function (uploadedFile) {
        return function (e) {

            if (file.type == "application/zip") {
                console.log("not yet handled");
                // TODO: we have to first unzip the file, then browse it
                return;
            }
            else {
                try {
                    var xmlDoc = $.parseXML(e.target.result);
                }
                catch (error) {
                    console.log("error while loading xml file");
                    // TODO: write error
                    return;
                }
                loadTemplateFromXML(xmlDoc);

            }
        };
    })(file);

    // Read in the svg file (in-memory)
    console.log("Attempting to read file '" + file.name + "'...");

    // Reads the SVG contents into a string
    readerString.readAsText(file);

}

function updateInterface() {
    if (window.board != null && window.device != null) {
        var params = drawDevice();
        drawBoard(params);
    }
}

function drawDevice() {
    
    var container = $("#rendering");
    container.html("");

    // compute sizes
    var widthPX = container.width();
    var ratio = widthPX / window.device.getWidth();
    var heightPX = window.device.getHeight() * ratio;

    // draw the tablet's body
    container.height(heightPX);
    container.css("border-radius", (window.device.margins["cornerRadius"] * ratio) + "px");
    container.css("background", "black");
    container.css("position", "relative");

    // draw the screen
    container.append("<div id=\"screen\"></div>");
    var screen = $("#screen");
    screen.css("position", "absolute");
    screen.css("background", "#eee");
    screen.css("display", "inline-block");
    screen.css("left", (window.device.margins["left"] * ratio) + "px");
    screen.css("top", (window.device.margins["top"] * ratio) + "px");
    screen.css("width", (window.device.screen["width"] * ratio) + "px");
    screen.css("height", (window.device.screen["height"] * ratio) + "px");

    // draw the camera
    container.append("<div id=\"camera\"></div>");
    var camera = $("#camera");
    camera.css("position", "absolute");
    camera.css("background", "#444");
    camera.css("border-radius", "50%");
    camera.css("display", "inline-block");
    camera.css("top", ((window.device.margins["top"] 
                        - window.device.camera["y"]
                        - window.device.camera["radius"]) * ratio) + "px");
    camera.css("left", ((window.device.margins["left"] 
                         + window.device.screen["width"] / 2
                         + window.device.camera["x"]
                         - window.device.camera["radius"]) * ratio) + "px");
    camera.css("width", (window.device.camera["radius"] * 2 * ratio) + "px");
    camera.css("height", (window.device.camera["radius"] * 2 * ratio) + "px");

    return {"screen": screen, "ratio": ratio};
}

function drawBoard(params) {
    var screen = params["screen"];
    var ratio = params["ratio"];

    var pictoID = 0;
    for(var p of window.board.getElementsInScreen(device)) {
        screen.append("<div class=\"pictogram\" id=\"picto" + pictoID + "\"></div>");
        var pictoHTML = $("#picto" + pictoID);
        pictoHTML.css("position", "absolute");
        pictoHTML.css("background", "white");
        pictoHTML.css("display", "inline-block");
        pictoHTML.css("top", (p.top * ratio) + "px");
        pictoHTML.css("left", (p.left * ratio) + "px");
        pictoHTML.css("width", (p.width * ratio) + "px");
        pictoHTML.css("height", (p.height * ratio) + "px");

        pictoID += 1;
    }

}
