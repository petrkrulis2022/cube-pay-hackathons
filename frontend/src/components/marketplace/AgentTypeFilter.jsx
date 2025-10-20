import React from "react";
const AgentTypeFilter = ({ value, onChange, types }) => (
  <div className="agent-type-filter">
    <label>Type:</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">All Types</option>
      {types.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  </div>
);
export default AgentTypeFilter;
