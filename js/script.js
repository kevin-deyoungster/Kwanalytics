/*
This modules handles interactions in the app: event-handlers, etc.
Also constants, etc.
*/

const STATUS = document.getElementById("currentLocation");
const MAP_DIV = document.getElementById("map");
const GOOGLE_API_KEY = "";
const MONGO_API_KEY = "";

let MAP;

if ("geolocation" in navigator) {
    console.log(`Geolocation Available`);
} else {
    alert(`Geolocation Not Available`);
    console.log(`Geolocation Not Available`);
}

document.getElementById("btnFind").onclick = () => {
    GetLocationOnMap();
};

document.getElementById("btnTrack").onclick = e => {
    StartTracking(e.target);
};

document.getElementById("btnSave").onclick = e => {
    if (trail) {
        console.log(trail);
        addDirtRoadToDatabase(trail);
    }
};

document.getElementById("btnReport").onclick = e => {
    console.log("Download Report");
    downloadReport();
    // addDirtRoadToDatabase(trail);
};

async function GetLocationOnMap() {
    try {
        console.log("Getting User Position and Showing on Map");

        const position = await getCurrentLocationGPS();

        const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        setStatus("Getting Location...");
        console.log("Current Location at " + coords);
        initializeMap(MAP_DIV, coords);
        addHomeMarkerToMap(coords);

        console.log(`Showing current position (${coords.lat}, ${coords.lng}) on Map`);

        const address = await maps_api.getLocationName(coords);
        setStatus(`Location: ${address}`);
    } catch (error) {
        setStatus(error.message);
    }
}

async function addDirtRoadToDatabase(coordinates) {
    console.log(`Adding ${coordinates} to database`);
    console.log(coordinates);
    let paths = "";
    const step = coordinates.length < 50 ? 1 : Math.floor(coordinates.length / 50);

    // pick every step-th coordinate so we can get 50
    for (let i = 0; i < coordinates.length; i += step) {
        paths += `${coordinates[i].lat},${coordinates[i].lng}`;
        paths += i === coordinates.length - 1 ? "" : "|";
    }
    paths = paths.slice(0, -1); // remove the final '|' from the end to avoid api errors
    const url = `https://roads.googleapis.com/v1/snapToRoads?path=${paths}&key=${GOOGLE_API_KEY}`;
    const response = await (await fetch(url)).json();

    const snapped_coords = response.snappedPoints.map(coords => {
        return {
            lat: coords.location.latitude,
            lng: coords.location.longitude
        };
    });

    const midPoint = snapped_coords[parseInt(snapped_coords.length / 2)];
    const name = await maps_api.getLocationName(midPoint);

    const startPos = snapped_coords[0];
    const endPos = snapped_coords[snapped_coords.length - 1];
    console.log(`${startPos} - ${endPos}`);

    const trail = {
        id: name ? name : "Dirt Road",
        points: snapped_coords,
        count: snapped_coords.length,
        anchor: midPoint,
        date: getDate(),
        distance: haversine_distance(startPos.lat, startPos.lng, endPos.lat, endPos.lng)
    };

    console.log(trail.points.length);

    const url2 = `https://api.mlab.com/api/1/databases/kwanalytics/collections/trails?apiKey=${MONGO_API_KEY}`;
    const response2 = await (await fetch(url2, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(trail)
    })).json();

    console.log(response2);
}

async function getDirtRoadsFromDatabase() {
    const url = `https://api.mlab.com/api/1/databases/kwanalytics/collections/trails?apiKey=${MONGO_API_KEY}`;
    const response = await (await fetch(url)).json();
    const trails = response;
    let distance = 0;
    trails.forEach(trail => {
        drawSnappedPolyline(trail);
        distance += parseFloat(trail.distance.split(" ")[0]);
    });

    document.getElementById("roadCount").textContent = trails.length;
    document.getElementById("roadDist").textContent = distance.toFixed(2);
    return trails;
}

let encodedUri;

async function generateReport(trails) {
    // Generates CSV containing the various dirt roads

    // Sort by distance
    trails.sort((a, b) => a.distance - b.distance);

    // convert to right model
    const trailCount = trails.length;
    const trailsReport = trails.map((trail, index) => {
        console.log(trail.id);
        console.log(trail.id.replace(",", " -"));
        return {
            id: index++,
            name: trail.id.replace(/,/g, " - "),
            distance: trail.distance,
            start: `(${trail.points[0].lat} * ${trail.points[0].lng})`,
            end: `(${trail.points[trailCount - 1].lat} * ${trail.points[trailCount - 1].lng})`,
            dateAdded: trail.date
        };
    });

    let csvContent = "data:text/csv;charset=utf-8,";
    let heading = "ID, Name of Road, Distance (km), Start Position, End Position, Date Added\n";
    csvContent += heading;
    trailsReport.forEach(info => {
        dataString = `${info.id},${info.name},${info.distance},${info.start},${info.end},${info.dateAdded}`;
        csvContent += dataString + "\n";
    });
    console.log(csvContent);

    encodedUri = encodeURI(csvContent);
    document.getElementById("btnReport").style.display = "inline-block";
}

async function downloadReport() {
    // initiates the download report feature'
    window.open(encodedUri);
}

async function init() {
    await GetLocationOnMap();
    const trails = await getDirtRoadsFromDatabase();
    await generateReport(trails);
}

init();
