
export async function fetchCodeFromBackend(owner: string, repo: string, filePath: string): Promise<string> {
  const apiUrl = `http://localhost:8080/api/file?path=${encodeURIComponent(filePath)}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.text();

    if (!responseData) {
      return `Oops, No Content Found on local disk`;
    }

    return responseData;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

export async function fetchAllCodeFiles(): Promise<{ [path: string]: string }> {
  const apiUrl = `http://localhost:8080/api/files/all`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch all files: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching all files:', error);
    return {};
  }
}
