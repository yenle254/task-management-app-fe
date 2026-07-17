const getApiUrl = () => {
  // thinh
  //return "http://192.168.80.1:3000/api";
  // mthanh - wf
  //return "http://192.168.11.190:3000/api";
  return "http://10.0.2.2:3000/api";
  // mt - host
  //return "http://10.135.49.64:3000/api";
  // wf - uitpublic
  //return "http://10.45.29.128:3000/api";
};

export const API_URL = getApiUrl();

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  TIMEOUT: 30000,
};

export default API_CONFIG;
