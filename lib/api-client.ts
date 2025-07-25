const API_BASE_URL = "https://avtokontinent-uz.onrender.com/api";

export async function fetcher<T>(
  url: string,
  method = "GET",
  data?: any,
  isMultipart = false // ← Yangi parametr
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {},
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    if (isMultipart) {
      // multipart uchun body bu FormData bo'ladi
      options.body = data;
    } else {
      options.headers = {
        "Content-Type": "application/json",
      };
      options.body = JSON.stringify(data);
    }
  }

  const response = await fetch(`${API_BASE_URL}${url}`, options);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return {} as T;
}
