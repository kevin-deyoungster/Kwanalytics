async function reverseGeocode(coords) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${
        coords.lat
    }, ${coords.lng}&key=${API_KEY}`;
    const response = await (await fetch(url)).json();
    return response["results"][0]["formatted_address"];
}

async function snapRoad(coordinates) {
    let paths = "";
    const step =
        coordinates.length < 50 ? 1 : Math.floor(coordinates.length / 50);

    // pick every step-th coordinate so we can get 50
    for (let i = 0; i < coordinates.length; i += step) {
        paths += `${coordinates[i].lat},${coordinates[i].lng}`;
        paths += i === coordinates.length - 1 ? "" : "|";
    }
    paths = paths.slice(0, -1); // remove the final '|' from the end to avoid api errors
    const url = `https://roads.googleapis.com/v1/snapToRoads?path=${paths}&key=${API_KEY}`;
    const response = await (await fetch(url)).json();

    const snapped_coords = response.snappedPoints.map(coords => {
        return {
            lat: coords.location.latitude,
            lng: coords.location.longitude
        };
    });

    const trail = {
        id: "1",
        points: snapped_coords,
        count: snapped_coords.length,
        anchor: snapped_coords[parseInt(snapped_coords.length / 2)],
        date: new Date()
    };
    drawSnappedPolyline(trail);
    return response;
}

function addMarkerToMap(coords, map = MAP, info_content = "") {
    let marker = new google.maps.Marker({ position: coords, map: MAP });
    const infowindow = new google.maps.InfoWindow({
        content: info_content
    });

    marker.addListener("click", function() {
        infowindow.open(map, marker);
    });
    return marker;
}

function addHomeMarkerToMap(coords, map = MAP) {
    let marker = new google.maps.Marker({
        position: coords,
        map: MAP,
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
    });

    const infowindow = new google.maps.InfoWindow({
        content: "Current Location"
    });

    marker.addListener("click", function() {
        infowindow.open(map, marker);
    });

    return marker;
}

function drawSnappedPolyline(trail) {
    console.log("drawing road");

    // console.log(trail);
    trail.points = trail.points.map(t => {
        return {
            lat: parseFloat(t.lat),
            lng: parseFloat(t.lng)
        };
    });

    // console.log(trail.points[0]);

    var snappedPolyline = new google.maps.Polyline({
        path: trail.points,
        strokeColor: "#d2a263",
        strokeWeight: 5
    });

    var contentString = `
    <div id="content">
    <div id="bodyContent">
        <p><strong> Road ${trail.id} </strong></p>
        <p> Number of Data Points: ${trail.count}</p>
        <p> Distance: ${trail.distance} </p>
        <p> Date Added: ${trail.date} </p>
    </div> 
    </div>`;

    let marker = addMarkerToMap(trail.anchor, MAP, contentString);
    snappedPolyline.setMap(MAP);

    MAP.setOptions({
        center: trail.anchor
    });
}

const maps_api = {
    getLocationName: reverseGeocode,
    snapRoad: snapRoad
};
