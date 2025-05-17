import axios from "axios"

const client = axios.create({
    baseURL: 'http://localhost:8000/api/'
});
  
export const api = async ({ ...options }) => {
    client.defaults.headers.common.Authorization = `Bearer token`;
    const onSuccess = (response) => response;
    const onError = (error) => {
        throw error; // Rethrow the error so React Query can catch it
    };
    return await client(options).then(onSuccess).catch(onError);
};

