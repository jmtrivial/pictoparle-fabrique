$(document).ready(function () {
    setDeviceMenu();
    setLayersMenu();


    $("#cuttingPDF").click(function(e) {
        var params = getParameters();
        var doc = window.device.boxPDF(params);
        if (doc != null) {
            doc.save("découpe boite " + window.device.name + ".pdf");     
        } else
            alert("La taille de la tablette n'est pas supportée par ce rendu pdf.");
    });

    $("#cuttingDXF").click(function(e) {
        var params = getParameters();
        var doc = window.device.boxDXF(params);
        if (doc != null) {
            var blob = new Blob([doc.toDxfString()], {type: 'application/dxf'});
            saveAs(blob, "découpe boite " + window.device.name + ".dxf");     
        } else
            alert("Une erreur s'est produite pendant le rendu dxf.");
    });

    window.dbDefault = parseFloat($("#deviceBuffer").val());
    $("#deviceBuffer").on("change", function(e) {
        if (parseFloat($(this).val()) != window.dbDefault) {
            $("#deviceBuffer").parent().addClass("warning");
        }
        else
            $("#deviceBuffer").parent().removeClass("warning");
    });

    $("#calibration").click(function(e) {
        getCalibrationPDF();
    });



});

function getParameters() {
    var result = {};
    for(var id of ["boxThickness", "boardThickness", "deviceBuffer", "kerf", "scale"]) {
        result[id] = $("#" + id).val();
    }
    if (window.layer_config == "one-layer")
        result["layer_config"] = 1;
    else if (window.layer_config == "two-layers")
        result["layer_config"] = 2;
    else if (window.layer_config == "three-layers")
        result["layer_config"] = 3;
    else {
        console.log(window.layer_config);
        //result["layer_config"] = 3;
    }

    
    return result;
}

function updateInterface() {
    // nothing to do
}