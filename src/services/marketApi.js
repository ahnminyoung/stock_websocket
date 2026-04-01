import axios from 'axios';

const api = axios.create({
  baseURL: '/api/market',
  timeout: 7000,
});

const unwrap = (response) => response.data?.data;

export const fetchSummary = async () => unwrap(await api.get('/summary'));
export const fetchWatchlist = async () => unwrap(await api.get('/watchlist'));
export const fetchMovers = async () => unwrap(await api.get('/movers'));
