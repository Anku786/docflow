// export const API_BASE_URL = import.meta.env.VITE_API_URL;
export const API_BASE_URL = "http://localhost:5001/";

// DOCUMENTS API
export const SAVE_DOCUMENT = `${API_BASE_URL}documents/create`
export const GET_DOCUMENT = `${API_BASE_URL}documents`
export const DELETE_DOCUMENT = `${API_BASE_URL}documents/delete`
export const UPDATE_DOCUMENT = `${API_BASE_URL}documents/update`
export const EXTRACT_INVOICE = `${API_BASE_URL}documents/extract-invoice`

// RESUME API
export const SAVE_RESUME= `${API_BASE_URL}resumes/create`
export const GET_RESUME = `${API_BASE_URL}resumes`
export const DELETE_RESUME = `${API_BASE_URL}resumes/delete`
export const UPDATE_RESUME = `${API_BASE_URL}resumes/update`
export const EXTRACT_RESUME = `${API_BASE_URL}resumes/match`