
function uniqID() {
    return Math.floor(Math.random() * 1000000);
}

function setDeviceMenu() {
    window.devices = {};
    window.device = null;

    var deviceIDs = ['lenovo-tab-e10', 'lenovo-tab-m10', 'samsung-tab-a7-2021' ];

    for(var d of deviceIDs) {
        $.get("devices/" + d + ".xml?uniq=" + uniqID(), function(data) {
            var xml = $(data);              
            // load the device
            var device = Device.fromXML(data);
            window.devices[device.id] = device;              

            // create the entry 
            $("#devices").append("<a class=\"dropdown-item\" href=\"#devices\" id=\"" + device.id + "\">" + 
                    window.devices[device.id].name + "</a>");

            // set the interaction
            $("#" + device.id).click(function () {
                resetCase();
                setDevice(this.id);
            });

            // set default device
            if (window.device == null) {
                resetCase();
                setDevice(device.id);
            }
          });

    }


    $("#deviceCase").click(function() {

        if ($(this).is(':checked')) {
            $("#caseWidth").prop("disabled", false);
            $("#caseHeight").prop("disabled", false);
            $("#caseThickness").prop("disabled", false);
            $("#caseWidth").val(device.getWidth().toFixed(1));
            $("#caseWidth").attr("min", device.getWidth().toFixed(1));
            $("#caseHeight").val(device.getHeight().toFixed(1));
            $("#caseHeight").attr("min", device.getHeight().toFixed(1));
            $("#caseThickness").val(device.thickness).toFixed(1);
            $("#caseThickness").attr("min", device.thickness.toFixed(1));
        }
        else {
            resetCase();
        }
        // then reset device
        setDevice(device.id);
    });

    $("#caseWidth").change(function() {        
        setDevice(device.id);
    });
    $("#caseHeight").change(function() {
        setDevice(device.id);
    });
    $("#caseThickness").change(function() {
        setDevice(device.id);
    });
}

function resetCase() {
    $("#deviceCase").prop("checked", false);
    $("#caseWidth").prop("disabled", true);
    $("#caseHeight").prop("disabled", true);
    $("#caseThickness").prop("disabled", true);
    $("#caseWidth").val(0.0);
    $("#caseHeight").val(0.0);
    $("#caseThickness").val(0.0);
}

function setDevice(deviceID) {
    if ($("#deviceCase").is(':checked')) {
        window.device = window.devices[deviceID].newWithCase($("#caseWidth").val(), $("#caseHeight").val(), $("#caseThickness").val());
    }
    else {
        window.device = window.devices[deviceID];
    }
    $("#deviceWidthDesc").html(" (<strong>" + window.devices[deviceID].getWidth().toFixed(1) + " mm</strong>)");
    $("#deviceHeightDesc").html(" (<strong>" + window.devices[deviceID].getHeight().toFixed(1) + " mm</strong>)");
    $("#deviceThicknessDesc").html(" (<strong>" + window.devices[deviceID].thickness.toFixed(1) + " mm</strong>)");
    $("#device").html("Tablette&nbsp;: " + window.device.name);
    updateInterface();

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
