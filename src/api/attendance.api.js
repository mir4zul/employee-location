import api from "./axios";
import { API } from "./endpoints";

export const clockIn = (payload) =>
  api.post(API.CLOCK_IN, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const clockOut = (payload) =>
  api.post(API.CLOCK_OUT, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
