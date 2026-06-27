export default function HoverInfoPanel({
  hoveredCityInfo,
  selectedCity,
}) {
  return (
    <div
      className={`hover-info-panel ${
        hoveredCityInfo && !selectedCity ? "visible" : ""
      }`}
    >
      <div className="hover-info-title">
        {hoveredCityInfo?.name || ""}
      </div>

      <div className="hover-info-row">
        <span>Delivery Fee</span>

        <strong className="fee-value">
  {hoveredCityInfo?.fee !== null &&
  hoveredCityInfo?.fee !== undefined
    ? `$${hoveredCityInfo.fee}`
    : "N/A"}
</strong>
      </div>

      <div className="hover-info-row">
  <span>ETA</span>

  <strong className="eta-value">
  {hoveredCityInfo?.eta || "Unavailable"}
</strong>
</div>

      <div className="hover-info-row">
        <span>Status</span>

        <strong className="online-status">
          ● ONLINE
        </strong>
      </div>
    </div>
  );
}