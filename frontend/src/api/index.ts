import axios, { isAxiosError } from "axios";

axios.defaults.baseURL = process.env.BACKEND_URL;

export async function postUrl(url: string) {
  try {
    const response = await axios.post("/", { url });
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      return err.response;
    }
  }
}
