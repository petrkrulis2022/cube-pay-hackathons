// src/services/revolutApiClient.js
import fetch from "node-fetch";

const REVOLUT_API_URL = "https://sandbox-merchant.revolut.com/api";
const API_KEY = process.env.REVOLUT_API_KEY;

const revolutApiFetch = async (endpoint, options = {}) => {
  const url = `${REVOLUT_API_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Revolut API error: ${response.statusText}, ${errorBody}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error(`Error calling Revolut API endpoint: ${endpoint}`, error);
    throw error;
  }
};

export default revolutApiFetch;
