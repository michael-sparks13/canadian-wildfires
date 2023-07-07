// get page elements
const modal = document.querySelector("#modal");
const button = document.querySelector("#button");
const h1 = document.querySelector("h1");

// browser window width
let windowWidth =
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth;

// map options
const options = {
  zoomSnap: 0.1,
  zoomControl: false,
  center: [49.677662902665546, -79.53282086743701],
  zoom: setInitialMapZoom(windowWidth),
};

// vars for year+color
let currentYear = 2012;
const currentColor = "#009E41";
const color2023 = "#EA17EA";

//create map
const map = L.map("map", options);

//create panes
map.createPane("labels");
map.getPane("labels").style.zIndex = 404;

// request tiles and add to map
const tiles = L.tileLayer(
  "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.{ext}",
  {
    attribution:
      'Map tiles by <a href="https://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    ext: "png",
    opacity: 0.1,
  }
).addTo(map);

// Stamen toner labels
const labels = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png'",
  {
    attribution:
      'Map tiles by <a href="https://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    ext: "png",
    pane: "labels",
    opacity: 1,
  }
).addTo(map);

//fetch data for historical fires
fetch("data/simple2012-2021.geojson")
  .then(function (response) {
    return response.json();
  })
  .then(function (fires) {
    drawMap(fires);
    //fetch data for 2023 fires
    return fetch("data/simple2023.geojson");
  })
  .then(function (response) {
    return response.json();
  })
  .then(function (recentFires) {
    drawAnotherLayer(recentFires);
  })
  .catch(function (error) {
    console.log(`Oops, we ran into the following error:`, error);
  }); // end fetch and promise chain

//draw historical fires
//display only earliest year
function drawMap(fires) {
  const dataLayer = L.geoJson(fires, {
    style: function (feature) {
      //only show one year at a time
      if (feature.properties.YEAR != currentYear) {
        return {
          opacity: 0,
          fillOpacity: 0,
        };
      } else if (feature.properties.YEAR == currentYear) {
        return {
          color: currentColor,
        };
      }
    },
  }).addTo(map);

  //draw layer, then add slider
  createSliderUI(dataLayer);
} //end drawMap function

//draw 2023 fires
function drawAnotherLayer(recentFires) {
  const dataLayer = L.geoJson(recentFires, {
    style: function (feature) {
      //set 2023 fires with unique color
      return {
        color: color2023,
        fillOpacity: 1,
        fillColor: color2023,
      };
    },
  }).addTo(map);
} //end drawAnotherLayer function

//draw yearly layer on slider event
function updateMap(dataLayer, currentYear) {
  dataLayer.eachLayer(function (layer) {
    let props = layer.feature.properties.YEAR;
    if (props != currentYear) {
      layer.setStyle({
        opacity: 0,
        fillOpacity: 0,
      });
    } else {
      layer.setStyle({
        opacity: 1,
        fillOpacity: 1,
        color: currentColor,
      });
    }
  });
}

function createSliderUI(dataLayer) {
  const sliderControl = L.control({ position: "topright" });
  sliderControl.onAdd = function (map) {
    const slider = L.DomUtil.get("ui-controls");
    // disable scrolling of map while using controls
    L.DomEvent.disableScrollPropagation(slider);
    // disable click events while using controls
    L.DomEvent.disableClickPropagation(slider);
    return slider;
  };

  sliderControl.addTo(map);
  const slider = document.querySelector(".year-slider");
  // listen for changes on input element
  slider.addEventListener("input", function (e) {
    // get the value of the selected option
    const currentYear = e.target.valueAsNumber;
    // update the map with current timestamp
    updateMap(dataLayer, currentYear);
    // update timestamp in legend heading
    updateLegend(currentYear);
  });

  drawLegend();
} //end sliderUI

function drawLegend() {
  const legendControl = L.control({
    position: "topright",
  });
  // when the control is added to the map
  legendControl.onAdd = function (map) {
    // create a new division element with class of 'legend' and return
    const legend = L.DomUtil.create("div", "legend");
    return legend;
  };
  // add the legend control to the map
  legendControl.addTo(map);
  // select div and create legend title
  const legend = document.querySelector(".legend");
  //add legend details
  legend.innerHTML = "<h3>Area Burned</h3>";
  legend.innerHTML += `<li><span id=currentYear style="background:${currentColor}">${currentYear}</span>
        </li>`;
  legend.innerHTML += `<li><span style="background:${color2023}">2023</span>
        </li>`;
}

//update legend timestamp on slide event
function updateLegend(currentYear) {
  document.querySelector("#currentYear").innerHTML = currentYear;
} //end updateLegend

function setInitialMapZoom(windowWidth) {
  // create variable for map zoom level
  let mapZoom;
  // test for various browser widths
  if (windowWidth < 500) {
    mapZoom = 4.1;
  } else {
    mapZoom = 6.1;
  }
  return mapZoom;
} //end setInitialMapZoom
