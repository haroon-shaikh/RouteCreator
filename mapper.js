const submitButton = document.querySelector("#zipLookup button");

let map;
const coordinates = [];
submitButton.addEventListener("click", function(event) {
    event.preventDefault(); // Prevent the form from actually submitting

    const zipInput = document.querySelector("#zipLookup input");
    const zipValue = zipInput.value;
    const BASE_URL = 'https://nominatim.openstreetmap.org/search?format=json';

    fetch(`${BASE_URL}&postalcode=${zipValue}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latitude = data[0].lat;
                const longitude = data[0].lon;
                console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

                map = L.map('map').setView([latitude, longitude], 13);
                map.on('click', addMarker);


                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
            } else {
                console.error('No results found for the provided zipcode.');
            }
        })
        .catch(error => {
            console.error('An error occurred while fetching data:', error);
        });

});

function addMarker(e) {
    var popup = L.popup({ autoClose: false }) 
        .setLatLng(e.latlng)
        .setContent(`
            <p>Would you like to add this point?</p>
            <button id="addButton">Add</button>
            <button id="noButton">No</button>
        `)
        .addTo(map);

    const addButton = popup._container.querySelector('#addButton'); 
    addButton.addEventListener('click', function () {
        var marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        map.closePopup(popup);
        coordinates.push([e.latlng.lat,e.latlng.lng]);
        createRoute(coordinates);
        calculateStats(coordinates);

        });


    const noButton = popup._container.querySelector('#noButton'); 
    noButton.addEventListener('click', function () {
        map.closePopup(popup);
    });

    
}

map.on('click', addMarker);

function createRoute(coordinates){
    const route = L.polyline(coordinates, { color: 'blue' }).addTo(map);
}


function calculateStats(coordinates) {
    let sum = 0;
    const distanceDisplay = document.getElementById('distanceresult'); 
    for (let i = 0; i < coordinates.length - 1; i++) {
        const latLng1 = L.latLng(coordinates[i]);
        const latLng2 = L.latLng(coordinates[i + 1]);
        const distance = latLng1.distanceTo(latLng2);
        sum+= distance;
        distanceDisplay.textContent = `Total Distance: ${sum.toFixed(2)} meters`;
        

    }
    elevTo(coordinates);
    

}



async function elevTo(coordinates) {
    let firstElevation;
    let totalElevationGain = 0;
    
    try {
      for (const [latitude, longitude] of coordinates) {
        const apiUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error("Not good");
        }
        
        const data = await response.json();
        const currElevation = data.results[0].elevation;
        
        if (firstElevation !== undefined && currElevation > firstElevation) {
          totalElevationGain += currElevation - firstElevation;
        }
        
        if (firstElevation === undefined) {
          firstElevation = currElevation;
        }
      }
      const elevationDisplay = document.getElementById('elevationResult');

      elevationDisplay.textContent = `Total Elevation Gain: ${parseFloat(totalElevationGain).toFixed(2)} meters`;
  
    } catch (error) {
      console.error(error);
    }
  }
  

function clearMap() {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

}

document.addEventListener('DOMContentLoaded', function () {
    const clearButton = document.getElementById('clear');
    clearButton.addEventListener('click', function () {
        console.log('Clear button clicked');
        clearMap();
    });
});
