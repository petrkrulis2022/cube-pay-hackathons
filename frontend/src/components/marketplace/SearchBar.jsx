import React from "react";
const SearchBar = ({ value, onChange }) => (
  <input
    className="search-bar"
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Search agents..."
  />
);
export default SearchBar;
