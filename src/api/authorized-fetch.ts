// authorized-fetch.ts
export const authorizedFetch = async (
  input: RequestInfo,
  init?: RequestInit
) => {
  const storedAuth = localStorage.getItem("auth");
  const accessToken = storedAuth ? JSON.parse(storedAuth).accessToken : "";

  const headers = new Headers(init?.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    console.error("Unauthorized (401): Token possibly expired.");
  }

  return response;
};
