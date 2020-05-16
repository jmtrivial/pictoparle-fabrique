

$(document).ready(function () {
    $("#inputFile").on("change", handleFileSelect);

    window.board = null;
});

function handleFileSelect(evt) {
    var file = evt.target.files[0];

    if (file.type != "application/zip" && file.type != "application/xml" && file.type != "text/xml") {
        console.log("bad format");
        // TODO: add a message to the user
        return;
    }
    
    var readerString = new FileReader();

    // Closure to capture the file information.
    readerString.onload = (function(uploadedFile) {
        return function(e) {

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

                // load XML file
                board = Board.fromXML(xmlDoc);
                if (board != null) {
                    window.board = board;
                    // TODO: update display
                }
                else {
                    console.log("Not a valid board");
                    // TODO: write an error message 
                }
                console.log("on a chargé la planche");
            }
        }; 
    })(file);

    // Read in the svg file (in-memory)
    console.log("Attempting to read file '"+file.name+"'...");

    // Reads the SVG contents into a string
    readerString.readAsText(file);

}
