

$(document).ready(function () {
    $("#inputFile").on("change", handleFileSelect);

    window.board = null;
    window.device = null;
    window.images = {};

    setTemplateMenu();
    setDeviceMenu();

    $(window).resize(
        function() {
            updateInterface();
        }
    );

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


    // Read in the svg file (in-memory)
    console.log("Attempting to read file '" + file.name + "'...");

    if (file.name.match("\.xml$")) {
        console.log("on a un xml");
        var readerString = new FileReader();

        // Closure to capture the file information.
        readerString.onload = (function (uploadedFile) {
            return function (e) {

                try {
                    var xmlDoc = $.parseXML(e.target.result);
                }
                catch (error) {
                    console.log("error while loading xml file");
                    // TODO: write error
                    return;
                }
                var board = Board.fromXML(xmlDoc);              
                if (board != null) {
                    console.log("Loading board");
                    window.board = board;
                    window.board.checkImages(window.images);
                    updateInterface();
                }
            };
        })(file);
        
        // Reads the SVG contents into a string
        readerString.readAsText(file);
    }
    else if (file.name.match(".zip$")) {

        var zip = new JSZip();
        zip.loadAsync(file).then(function(zip) {
            // read board file
            const promises = [];
            window.error = false;

            promises.push(zip.file("board.xml").async("text").then(function success(txt) {
                try {
                    var xmlDoc = $.parseXML(txt);
                }
                catch (error) {
                    console.log("error while loading xml file");
                    window.error = true;
                    // TODO: write error
                    return;
                }
                var board = Board.fromXML(xmlDoc);              
                if (board != null) {
                    window.board = board;
                    console.log(JSON.stringify(window.board));
                    console.log("Loading board");
                }
            }));
            

            zip.forEach(function (relativePath, zipEntry) {  
                if (relativePath.match("^pictograms/.\*\\\.(png|jpg|jpeg)$")) {
                    promises.push(zip.file(relativePath).async("base64").then(function (content) {
                        window.images[relativePath.replace(/^pictograms\//g, "")] = content;
                        console.log("Loading ", relativePath.replace(/^pictograms\//g, ""));
                    }));
                }
            });

            Promise.all(promises).then(function (data) {
                if (window.error == false) {
                    window.board.checkImages(window.images);
                    console.log("Loading completed. Update interface.");
                    updateInterface();
                }
            });
        }); 

    }


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


function drawPictogram(pictoHTML, txt, image) {
    if (pictoHTML.width() < 150) { 
        pictoHTML.addClass("small");
    }

    pictoHTML.append("<form><input type=\"text\" class=\"btn btn-secondary btn-block pictotext btn-secondary\" placeholder=\"Ajouter un texte\" value=\"" + txt + "\"></form>");
    pictoHTML.find("input").change(function(e) {
        var pictoID = $(this).parent().parent().attr("id").replace("picto", "");
        window.board.setPictoText(pictoID, $(this).val());
    });

    if (image != "") {
        if (image in window.images) {
            var re = /(?:\.([^.]+))?$/;
            var ext = re.exec(image);
            var mimeType;
            if (ext == "png")
                mimeType = "image/png";
            else if (ext == "jpg" || ext == "jpeg")
                mimeType = "image/jpg";
            pictoHTML.append("<img class=\"pictoimage\" src=\"data\: " + mimeType + ";base64, " + window.images[image] + "\" alt=\"" + txt + "\" />");
        }
        else {
            console.log("Unable to find image " + image);
        }
        pictoHTML.append("<button type=\"button\" class=\"btn-delimage btn-image btn btn-secondary\">Supprimer l'image</button>");
    }
    else {
        pictoHTML.append("<button type=\"button\" class=\"btn-addimage btn-image btn btn-secondary\">Ajouter une image</button>");
    }
}

function drawBoard(params) {
    var screen = params["screen"];
    var ratio = params["ratio"];

    var pictoID = 0;
    for(var p of window.board.getElementsInScreen(device)) {
        var quit = p instanceof QuitButton;
        if (quit) {
            screen.append("<div class=\"pictogram quit\"></div>");
        }
        else
            screen.append("<div class=\"pictogram\" id=\"picto" + pictoID + "\"></div>");
        var pictoHTML = screen.children().last();
        pictoHTML.css("position", "absolute");
        pictoHTML.css("background", "white");
        pictoHTML.css("display", "inline-block");
        pictoHTML.css("top", (p.top * ratio) + "px");
        pictoHTML.css("left", (p.left * ratio) + "px");
        pictoHTML.css("width", (p.width * ratio) + "px");
        pictoHTML.css("height", (p.height * ratio) + "px");

        if (quit) {
            pictoHTML.append("<img src=\"images/cross.svg\" class=\"cross\" />");
            var cross = pictoHTML.find("img.cross");
            if (p.width > p.height) {
                cross.css("width", "auto");
                cross.css("height", "100%");
                cross.css("margin-left", ((p.width - p.height) / 2 * ratio) + "px");
            }
            else {
                cross.css("width", "100%");
                cross.css("height", "auto");
                cross.css("margin-top", ((p.height - p.width) / 2 * ratio) + "px");
            }   
        }
        else if (p instanceof PictogramInScreen) {
            drawPictogram(pictoHTML, p.text, p.image);
            pictoID += 1;
        }

    }

}
