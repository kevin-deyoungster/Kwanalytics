/* 
This module contains functions for dealing with geolocation and google maps
*/

function getCurrentLocationGPS(options) {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
}

function initializeMap(map_div, center_coords) {
    MAP = new google.maps.Map(map_div, {
        zoom: 18,
        center: center_coords
    });
}

let trail = [];
let amTracking = false;
let counter;
let secs = 0;

let locationWatcher;
async function StartTracking(textBox) {
    if (!amTracking) {
        // Change text of the button
        GetLocationOnMap();
        console.log("Tracking User Position");
        textBox.textContent = "00:00:00";
        textBox.classList.add("btn-tracking");

        // Start the counter
        counter = setInterval(function() {
            secs++;
            textBox.textContent = `${formatTime(secs)}`;
        }, 1000);

        // Start watching GPS coordinates
        locationWatcher = navigator.geolocation.watchPosition(
            pos => {
                trail.push(pos.coords);
                console.log(pos);
            },
            error => {
                console.log(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 60000
            }
        );
    } else {
        textBox.textContent = "+ Add Dirt Road";
        textBox.classList.remove("btn-tracking");

        secs = 0;
        clearInterval(counter);
        trail = trail.map(coordinate => {
            return { lat: coordinate.latitude, lng: coordinate.longitude };
        });

        // console.log(trail);
        // maps_api.snapRoad(trail);
        // maps_api.snapRoad(path1);

        // Ask user if they want to save the trail
        document.getElementById("btnSave").style.display = "inline-block";

        navigator.geolocation.clearWatch(locationWatcher);
    }

    amTracking = !amTracking;
}
