import axios, { isAxiosError } from "axios";

axios.defaults.baseURL = "https://r.utility.center";

export async function postUrl(url: string) {
  try {
    const response = await axios.post("/", { url });
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      return err.response?.data;
    }
  }
}
