// src/api.js
import axios from "axios";

// Hapa una-set baseURL ya Django backend
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/", 
  headers: {
    "Content-Type": "application/json",
  },
});

// Hii ndio important 👇 ili iweze kutumika App.jsx
export default api;
