import React from "react";
const NetworkFilter = ({ value, onChange, networks }) => (
  <div className="network-filter">
    <label>Network:</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">All Networks</option>
      {networks.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  </div>
);
export default NetworkFilter;
