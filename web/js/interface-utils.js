
function uniqID() {
    return Math.floor(Math.random() * 1000000);
}

function setDeviceMenu() {
    window.devices = {};
    window.device = null;

    var deviceIDs = ['lenovo-tab-e10', 'lenovo-tab-m10'];

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
                $("#device").html("Tablette&nbsp;: " + window.device.name);
                updateInterface();
            });

            // set default device
            if (window.device == null) {
                window.device = window.devices[device.id];
                $("#device").html("Tablette&nbsp;: " + window.device.name);
                updateInterface();
            }
          });

    }

}

function getCalibrationPDF() {
    var doc = new jsPDF();
    doc.setLineWidth(0.02);

    doc.setFontSize(14);
    doc.text("Page de calibration de Pictoparle", 10, 10);
    doc.setFontSize(8);


    var length = 16;
    doc.text("Imprimez ce document, puis mesurez attentivement la longueur des lignes ci-dessous afin de repérer celle mesurant exactement " + length + " centimètres. ", 10, 17);
    doc.text("Le ratio d'impression correspondant est le nombre inscrit à droite de la ligne de longueur correcte.", 10, 21);

    doc.setFontSize(5);
    
    for(var i = 0; i < 150; i += 1) {
        var ratio = 0.990 + 0.0005 * i;
        var shiftx = 10;
        var middley =  24.5 + (i) * 1.8;
        var l = length * 10 * ratio;
        var h = 0.5;
        doc.lines([[0, -h], [0, 2 * h], [0, -h], [l, 0], [0, h], [0, -2 * h]], shiftx, middley);
        doc.text(ratio.toFixed(4), shiftx + l + 2, 25 + (i) * 1.8);

    }
    doc.save("calibration.pdf"); 
}
