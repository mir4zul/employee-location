import api from "./axios";
import { API } from "./endpoints";

export const login = (data) => api.post(API.LOGIN, data);

export const logout = () => api.post(API.LOGOUT);

export const getProfile = () => api.get(API.PROFILE);
