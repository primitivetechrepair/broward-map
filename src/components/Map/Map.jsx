import React, { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import COUNTY_CONFIG from "../../data/counties";
import MAP_INTRO from "../../data/mapIntro";
import SHORT_LABELS from "../../data/mapLabels";
import HoverInfoPanel from "./HoverInfoPanel";

export default function Map() {
  const [geoData, setGeoData] = useState(null);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState(null);
  const [hoveredPolygonIndex, setHoveredPolygonIndex] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedFee, setSelectedFee] = useState(null);
  const [hoveredCity, setHoveredCity] = useState(null);
  const [cityCenters, setCityCenters] = useState([]);
  const availableCounties = Object.entries(COUNTY_CONFIG)
  .filter(([, county]) => county.enabled && county.showOnSelector)
  .sort(([, a], [, b]) => a.order - b.order);

const defaultCountyKey = availableCounties[0]?.[0] || "Broward";

const [selectedCounty, setSelectedCounty] = useState(defaultCountyKey);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [readyToRender, setReadyToRender] = useState(true);
  const [isCountyTransitioning, setIsCountyTransitioning] = useState(false);

  const navigate = useNavigate();
  const mapRef = useRef(null);


const currentCounty =
  COUNTY_CONFIG[selectedCounty] || COUNTY_CONFIG[defaultCountyKey];

const getCityDeliveryFee = (cityName) => {
  const fee = currentCounty.deliveryFees?.[cityName];

  return fee ?? currentCounty.defaultDeliveryFee ?? 0;
};

const getCityDeliveryEta = (cityName) => {
  return currentCounty.deliveryEta?.[cityName] ?? currentCounty.defaultEta ?? "Available";
};

const hoveredCityInfo = hoveredCity
  ? {
      name: hoveredCity,
      fee: getCityDeliveryFee(hoveredCity),
      eta: getCityDeliveryEta(hoveredCity),
    }
  : null;
  

const currentMapCenter = isMobile
  ? currentCounty.mobileCenter || currentCounty.center
  : currentCounty.desktopCenter || currentCounty.center;

const currentMapZoom = isMobile
  ? currentCounty.mobileZoom ?? currentCounty.zoom
  : currentCounty.desktopZoom ?? currentCounty.zoom;
  
const currentMinZoom = isMobile
  ? currentCounty.mobileMinZoom ?? 8.5
  : currentCounty.desktopMinZoom ?? 9.8;

const currentMaxZoom = isMobile
  ? currentCounty.mobileMaxZoom ?? 14
  : currentCounty.desktopMaxZoom ?? 14;

  const handleCountyChange = (countyKey) => {
  if (countyKey === selectedCounty) return;

  setIsCountyTransitioning(true);

  setTimeout(() => {
    setSelectedCounty(countyKey);
  }, 140);

  setTimeout(() => {
    setIsCountyTransitioning(false);
  }, 280);
};

const handleResetMap = () => {
  setSelectedPolygonIndex(null);
  setHoveredPolygonIndex(null);
  setSelectedCity(null);
  setSelectedFee(null);
  setHoveredCity(null);

  if (mapRef.current) {
    mapRef.current.flyTo(
  currentMapCenter,
  currentMapZoom,
  {
    duration: 0.45,
    easeLinearity: 0.35,
  }
);
  }
};

  /* ================= Responsiveness */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
  if (!mapRef.current) return;

  mapRef.current.setView(
    currentMapCenter,
    currentMapZoom,
    {
      animate: false,
    }
  );
}, [
  selectedCounty,
  isMobile,
  currentMapCenter?.[0],
  currentMapCenter?.[1],
  currentMapZoom,
  currentMinZoom,
  currentMaxZoom,
]);

  /* ================= Mobile Render Delay */
  useEffect(() => {
    setReadyToRender(false);
    const timer = setTimeout(() => setReadyToRender(true), 50);
    return () => clearTimeout(timer);
  }, [selectedCounty]);

  /* ================= Load GeoJSON */
  useEffect(() => {
    setGeoData(null);
    setSelectedPolygonIndex(null);
    setHoveredPolygonIndex(null);
    setSelectedCity(null);
    setSelectedFee(null);
    setCityCenters([]);

    fetch(currentCounty.file)
      .then(res => res.json())
      .then(data => setGeoData(data));
  }, [currentCounty.file]);

  /* ================= Precompute Centers */
useEffect(() => {
  if (!geoData) return;

  const boundsArr = geoData.features.map((feature) =>
    L.geoJSON(feature).getBounds()
  );

  setCityCenters(boundsArr.map((bounds) => bounds.getCenter()));
}, [geoData]);


  /* ================= Polygon Styles */
const getPolygonStyle = (index) => {
  const isSelected = index === selectedPolygonIndex;
  const isHovered = index === hoveredPolygonIndex;

  return {
    color: isSelected
  ? "#ff4ec4"
  : isHovered
  ? "#00e5ff"
  : "rgba(0, 229, 255, 0.28)",

    weight: isSelected ? 4 : isHovered ? 3 : 1.6,

    opacity: isSelected ? 1 : isHovered ? 0.96 : 0.72,

    fillColor: isSelected
  ? "#ff4ec4"
  : isHovered
  ? "#00e5ff"
  : "#10182a",

    fillOpacity: isSelected ? 0.78 : isHovered ? 0.64 : 0.68,

    lineCap: "round",
    lineJoin: "round",

    className: isSelected
      ? "glow-polygon selected-polygon"
      : isHovered
      ? "glow-polygon hovered-polygon"
      : "glow-polygon idle-polygon",
  };
};

  /* ================= Polygon Events (FIXED) */
  const onEachPolygon = (feature, layer, index) => {
  const cityName = currentCounty.labels[index];

  if (!cityName) return;

  layer.on({
    mouseover: () => {
      if (window.innerWidth >= 769) {
        setHoveredPolygonIndex(index);
setHoveredCity(cityName);
      }
    },
    mouseout: () => {
      setHoveredPolygonIndex(null);
setHoveredCity(null);
    },
    click: () => {
  setSelectedPolygonIndex(index);
  setSelectedCity(cityName);
  setSelectedFee(getCityDeliveryFee(cityName));

  const selectedCenter = cityCenters[index];

  if (mapRef.current && selectedCenter) {
    mapRef.current.flyTo(
  [selectedCenter.lat, selectedCenter.lng],
  currentMapZoom + 0.25,
  {
    duration: 0.45,
    easeLinearity: 0.35,
  }
);
  }
}
  });
};

  const createCityLabelIcon = (label, index) => {
  return L.divIcon({
    className: "city-name-label-icon",
    html: `<div class="city-name-label ${
  index === selectedPolygonIndex ? "selected-city-label" : ""
}">${label}</div>`,
    iconSize: [180, 70],
    iconAnchor: [90, 35],
  });
};

  /* ================= Render */
  return (
    <div
  className={`map-wrapper ${
    isCountyTransitioning ? "county-transitioning" : ""
  }`}
>

  <div className="map-heading-container">
  <h1 className="map-heading">{currentCounty.displayName}</h1>

  <div className="map-zone">
    {MAP_INTRO.zoneLabel}
  </div>
</div>

  <div className="county-selector">
  <div className="county-selector-label">{MAP_INTRO.selectorLabel}</div>

  <button
    type="button"
    className="reset-map-btn"
    onClick={handleResetMap}
  >
    Reset Map
  </button>

  <div className="county-selector-buttons">
    {availableCounties.map(([countyKey, county]) => (
      <button
        key={countyKey}
        type="button"
        className={`county-selector-btn ${
          selectedCounty === countyKey ? "active" : ""
        }`}
        onClick={() => handleCountyChange(countyKey)}
      >
        {county.displayName}
      </button>
    ))}
  </div>
</div>

<HoverInfoPanel
  hoveredCityInfo={hoveredCityInfo}
  selectedCity={selectedCity}
/>

      {readyToRender && geoData && (
        <MapContainer
  ref={mapRef}
  key={`${selectedCounty}-${isMobile ? "mobile" : "desktop"}`}
  center={currentMapCenter}
  zoom={currentMapZoom}
  minZoom={currentMinZoom}
  maxZoom={currentMaxZoom}
  zoomSnap={0.1}
  style={{ width: "100%", height: "100%" }}
  dragging={false}
  scrollWheelZoom={false}
  doubleClickZoom={false}
  touchZoom={false}
  boxZoom={false}
  keyboard={false}
  zoomControl={false}
  tap={true}
  tapTolerance={20}
>
          <TileLayer url="" opacity={0} />

          {geoData.features.map((f, i) => (
            <GeoJSON
              key={i}
              data={f}
              style={() => getPolygonStyle(i)}
              onEachFeature={(feature, layer) => onEachPolygon(feature, layer, i)}
            />
          ))}

          {cityCenters.map((c, i) => {
  const label = currentCounty.labels[i];

  if (!label) return null;

  const displayLabel = (SHORT_LABELS[label] || label).toUpperCase();

  const offset = isMobile
  ? currentCounty.mobileLabelOffsets?.[label] ||
    currentCounty.labelOffsets?.[label] ||
    { lat: 0, lng: 0 }
  : currentCounty.labelOffsets?.[label] || { lat: 0, lng: 0 };

const pos = [c.lat + offset.lat, c.lng + offset.lng];

  return (
    <Marker
      key={`${selectedCounty}-${i}`}
      position={pos}
      icon={createCityLabelIcon(displayLabel, i)}
      interactive={false}
    />
  );
})}
        </MapContainer>
      )}

      {selectedCity && (
        <div className="selection-box">
          <div className="selection-title">SERVICE AREA</div>

<div className="selection-city">{selectedCity}</div>

<div className="selection-fee-label">DELIVERY FEE</div>

<div className="selection-fee">
  ${selectedFee}
</div>
          <div className="selection-actions">
            <button
  type="button"
  className="confirm-btn"
  onClick={() =>
    navigate("/products", {
      state: {
        city: selectedCity,
        fee: selectedFee,
        deliveryFee: selectedFee,
      },
    })
  }
>
  Select
</button>
            <button className="cancel-btn" onClick={() => setSelectedCity(null)}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
