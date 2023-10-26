// get page elements
const modal = document.querySelector("#modal");
const button = document.querySelector("#button");
const h1 = document.querySelector("h1");

// browser window width
const windowWidth =
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth;

// map options
const options = {
  zoomSnap: 0.1,
  zoomControl: false,
  center: [57.677662902665546, -100.53282086743701],
  zoom: setInitialMapZoom(windowWidth),
};

const acres = {
  "2012": 4.19,
  "2013":10.36,
  "2014":9.54,
  "2015":8.32,
  "2016":3.02,
  "2017":7.57,
  "2018":4.66,
  "2019":4.05,
  "2020":0.54,
  "2021":9.68

}

//vars for year+color
let currentYear = 2012;
const currentColor = "#009E41";
const color2023 = "#EA17EA";

//var for acres
const acres_2023 = 40.13;
const acres_2012 = 4.19;
let acres_past = 0;

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
fetch("data/12-21-simple.geojson")
  .then(function (response) {
    return response.json();
  })
  .then(function (fires) {
    drawMap(fires);
    //fetch data for 2023 fires
    return fetch("data/2023perimeters_904.geojson");
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
          fillColor: currentColor,
          fillOpacity: 0.7,
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
        fillOpacity: 1,
        color: color2023,
        fillColor: color2023,
      };
    },
  }).addTo(map);

  let year2023 = document.querySelector("#year2023");
  year2023.innerHTML += `<span>${acres_2023} M</span>`;
} //end drawAnotherLayer function

//draw yearly layer on slider event
function updateMap(dataLayer, currentYear) {
  dataLayer.eachLayer(function (l) {
    let props = l.feature.properties.YEAR;
    if (props != currentYear) {
      l.setStyle({
        opacity: 0,
        fillOpacity: 0,
      });
    } else if (props == currentYear) {
      l.setStyle({
        fillOpacity: 0.5,
        color: currentColor,
        fillColor: currentColor,
        opacity: 1
      });
    }
  });
}

function createSliderUI(dataLayer) {
   drawLegend(dataLayer);
  let sliderControl = L.control({ position: "topright" });


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

    updateLegend(currentYear, dataLayer);
  });

 
} //end sliderUI

function drawLegend(dataLayer) {
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
  legend.innerHTML = "<h3>Acres Burned</h3>";
  legend.innerHTML += `<li id=pastYear><span id=currentYear style="background:${currentColor}">${currentYear}</span>
        </li>`;
  legend.innerHTML += `<li id=year2023><span style="background:${color2023}">2023</span>
        </li>`;

  //calculate acres for 2012 on map load
  
  let currentYearElement = document.querySelector("#pastYear");
  currentYearElement.innerHTML += `<span id=acresPast>${acres_2012} M</span>`;
} //end drawLegend

//update legend timestamp & acerage on slide event
function updateLegend(currentYear, dataLayer) {
  //update legend timestamp
  document.querySelector("#currentYear").innerHTML = currentYear;
  updateMap(dataLayer, currentYear);
  //update acerage
  let currentYearElement = document.querySelector("#pastYear");
  let acresPastElement = document.querySelector("#acresPast");

  acresPastElement.innerHTML = `<span id=acresPast>${acres[currentYear]} M</span>`;
} //end updateLegend

function setInitialMapZoom(windowWidth) {
  // create variable for map zoom level
  let mapZoom;
  // test for various browser widths
  if (windowWidth < 500) {
    mapZoom = 2.8;
  } else {
    mapZoom = 4.3;
  }
  return mapZoom;
} //end setInitialMapZoom
