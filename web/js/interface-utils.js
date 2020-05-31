
function uniqID() {
    return Math.floor(Math.random() * 1000000);
}

function setDeviceMenu() {
    window.devices = {};
    window.device = null;

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