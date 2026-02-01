/**
 * It fetches a json response, and if the response is not ok, it throws an error with the response and
 * the data
 * @param args - The arguments to pass to fetch.
 * @returns 
 */
class FetchJsonError extends Error {
  response: Response;
  data: any;
  /**
   *
   * @param message
   * @param response
   * @param data
   */
  constructor(message: string, response: Response, data: any) {
    super(message);
    this.response = response;
    this.data = data;
  }
}

export const fetchJson = async (...args: Parameters<typeof fetch>) => {
  try {
    const response = await fetch(...args);
    // if the server replies, there's always some data in json
    // if there's a network error, it will throw at the previous line
    const data = await response.json();
    if (response.ok) {
      return data;
    }
    throw new FetchJsonError(response.statusText, response, data);
  } catch (error: unknown) {
    if (error instanceof FetchJsonError) {
      if (!error.data) {
        error.data = { message: error.message };
      }
      throw error;
    } else if (error instanceof Error) {
      throw new FetchJsonError(error.message, {} as Response, { message: error.message });
    } else {
      throw error;
    }
  }
}
