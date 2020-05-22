

$(document).ready(function () {
    $("#inputFile").on("change", handleFileSelect);

    $("#downloadZIP").click(function (e) {
        if (!checkValid())
            return;

        var xmlfile = window.board.toXML();

        var zip = new JSZip();
        zip.file("board.xml", xmlfile);

        for(var f in window.images) {
            if (board.hasImage(f)) {
                zip.file("pictograms/" + f, removeURLPrefix(window.images[f]), {base64: true});
            }
        }

        zip.generateAsync({type:"blob"}).then(function (blob) {
                saveAs(blob, window.board.name + ".zip");                     
        }, function (err) {
            jQuery("#blob").text(err);
            console.log("error", err);
        });
        
    });

    $("#downloadPictosPDF").click(function (e) {
        if (!checkValid())
            return;

        var doc = window.board.toPDF(window.device);
        if (doc != nul)
            doc.save(window.board.name + ".pdf");
        else
            alert("La taille de l'écran de tablette n'est pas supportée par ce rendu pdf.");
    });

    $("#boardName").change(changedBoardName);
    $("#boardID").change(changedBoardID);

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

    $("#validateNewTemplate").click(function(e) {
        $("#setNewTemplateDialog").modal("hide");
        window.board = window.templates[window.selectedTemplate].clone();
        updateInterface();
    });


});

function removeURLPrefix(fileString) {
    return fileString.split(",")[1].replace(/\s/g, "");
}

function changedBoardID(e) {
    window.board.id = $(this).val();
}

function changedBoardName(e) {
    window.board.name = $(this).val();
}


function setDeviceMenu() {
    window.devices = {};

    var deviceIDs = ['lenovo-tab-e10'];

    for(var d of deviceIDs) {
        $.get("devices/" + d + ".xml?uniq=" + uniqID(), function(data) {
            var xml = $(data);              
            // load the device
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

function checkValid() {
    if (window.board.name == "") {
        alert("Vous devez donner un nom à la planche avant de la sauver.");
        return false;
    }

    return true;
}

function uniqID() {
    return Math.floor(Math.random() * 1000000);
}


function setTemplateMenu() {
    window.templates = {};

    var templatesIDs = ["3x3-fixedleft", "3x3-fixedright", "4x3", "4x2-fixedtop", "4x2-fixedbottom"];
    for (var t of templatesIDs) {
        $.get("templates/" + t + ".xml?uniq=" + uniqID(), function(data) {
            var xml = $(data);              
            // load the template
            var board = Board.fromXML(data);  
            window.templates[board.id] = board;

            // create the entry 
            $("#templates").append("<a class=\"dropdown-item\" href=\"#\" id=\"" + board.id + "\">" + 
                    window.templates[board.id].name + "</a>");
            
            board.name = "";            

            // set the interaction
            $("#" + board.id).click(function () {
                if (window.board != null && !window.board.isEmpty()) {
                    window.selectedTemplate = this.id;
                    $('#setNewTemplateDialog').modal("show");
                }
                else {
                    window.board = window.templates[this.id];
                    updateInterface();
                }

            });

            // set default device
            if (window.board == null) {
                window.board = window.templates[board.id].clone();
                updateInterface();
            }
            
          });

    }
}

function handleFileSelect(evt) {
    var file = evt.target.files[0];

    if (file.type != "application/zip" && file.type != "application/xml" && file.type != "text/xml") {
        alert("Le fichier d'entrée doit être un zip (ou un xml) au format PictoParle");
        console.log("bad format");
        return;
    }


    // Read in the svg file (in-memory)
    console.log("Attempting to read file '" + file.name + "'...");

    if (file.name.match("\.xml$")) {
        var readerString = new FileReader();

        // Closure to capture the file information.
        readerString.onload = (function (uploadedFile) {
            return function (e) {

                try {
                    var xmlDoc = $.parseXML(e.target.result);
                }
                catch (error) {
                    console.log("error while loading xml file");
                    alert("Une erreur s'est produite pendant l'ouverture du fichier xml");
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
                    alert("Une erreur s'est produite pendant l'ouverture du fichier");
                    return;
                }
                var board = Board.fromXML(xmlDoc);              
                if (board != null) {
                    window.board = board;
                    console.log("Loading board");
                }
            }));
            

            zip.forEach(function (relativePath, zipEntry) {  
                if (relativePath.match("^pictograms/.\*\\\.(png|jpg|jpeg)$")) {
                    promises.push(zip.file(relativePath).async("base64").then(function (content) {
                        var re = /(?:\.([^.]+))?$/;
                        var ext = re.exec(relativePath);
                        var mimeType;
                        if (ext[1] == "png")
                            mimeType = "image/png";
                        else if (ext[1] == "jpg" || ext[1] == "jpeg")
                            mimeType = "image/jpg";
                        else {
                            console.log("Unknown extension:", ext[1]);
                        }
            
                        window.images[relativePath.replace(/^pictograms\//g, "")] = "data: " + mimeType + ";base64, " + content;
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
    // delete previous content
    pictoHTML.html("");

    if (pictoHTML.width() < 150) { 
        pictoHTML.addClass("small");
    }

    pictoHTML.append("<form><input type=\"text\" class=\"btn btn-secondary btn-block pictotext btn-secondary\" placeholder=\"Ajouter un texte\" value=\"" + txt + "\"></form>");
    pictoHTML.find("input").change(function(e) {
        var pictoID = $(this).parent().parent().attr("id").replace("picto", "");
        window.board.setPictoText(pictoID, $(this).val());
    });
    pictoHTML.find("input").focusin(function(e) {
        $(this).parent().parent().addClass("edit-text");
    });
    pictoHTML.find("input").focusout(function(e) {
        $(this).parent().parent().removeClass("edit-text");
    });

    pictoHTML.append("<button type=\"button\" class=\"btn-deltext btn btn-secondary\" alt=\"Supprimer le texte\">✕</button>");
    pictoHTML.find(".btn-deltext").click(function(e) {
        var pictoID = $(this).parent().attr("id").replace("picto", "");
        var picto = window.board.setPictoText(pictoID, "");
        drawPictogram($(this).parent(), picto.text, picto.image);
    });


    if (image != "") {
        if (image in window.images) {
            pictoHTML.append("<img class=\"pictoimage\" src=\"" + window.images[image] + "\" alt=\"" + txt + "\" />");
        }
        else {
            console.log("Unable to find image " + image);
        }
        pictoHTML.append("<button type=\"button\" class=\"btn-delimage btn-image btn btn-secondary\">Supprimer l'image</button>");
        pictoHTML.find(".btn-delimage").click(function(e) {
            var pictoID = $(this).parent().attr("id").replace("picto", "");
            var picto = window.board.deleteImage(pictoID);
            drawPictogram($(this).parent(), picto.text, picto.image);
        });
    }
    else {
        pictoHTML.append("<form> \
        <div class=\"btn-addimage btn-image btn btn-secondary\"> \
                <label style=\"padding: 0; margin: 0\">Ajouter une image</label> \
                <input type=\"file\" name=\"files[]\" accept=\"image/png;image/jpeg\" style=\"position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: pointer; opacity: 0\"> \
            </div></form>");
        pictoHTML.find(".btn-addimage").change(function(evt) {
            if (evt.target.value.length == 0) {
                return;
            }

            var pictoID = $(this).parent().parent().attr("id").replace("picto", "");
            var file = evt.target.files[0];

            if (!(file.name.match(".png$") || file.name.match(".jpg$") || file.name.match(".jpeg$"))) {
                alert("Les images doivent être au format png ou jpg");
                return;
            }

            

            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (uploadedFile) {
                return function (e) {
                    var finalName = uploadedFile.name;
                    while (finalName in window.images) {
                        finalName = uniqID()  + "-" + uploadedFile.name;
                    }
                    window.images[finalName] = e.target.result;
                    window.board.setImage(pictoID, finalName);
                    console.log("Set a new image (" + finalName + ") for pictogram #" + pictoID);
                    updateInterface();
                };
            })(file);

            reader.readAsDataURL(file);
        });
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

    $("#boardName").val(window.board.name);
    
    var id;
    if (typeof "window.board.id" === "int") {
        id = window.board.id;
    }
    else if (!String(window.board.id).match("^[0-9][0-9]?[0-9]?[0-9]?[0-9]?[0-9]?$")) {
        id = uniqID();
    }
    else {
        id = parseInt(window.board.id);
    }
    // replace the ID with the new one
    window.board.id = id;
    $("#boardID").val(id);

}
