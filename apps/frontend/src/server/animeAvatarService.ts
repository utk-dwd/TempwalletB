const ANIME_API_BASE_URL = import.meta.env.VITE_INDEPENDENT_ANIME_API_BASE_URL;

if (!ANIME_API_BASE_URL) {
  console.error(
    'CRITICAL: VITE_INDEPENDENT_ANIME_API_BASE_URL is not defined. Anime avatar functionality will not work.'
  );
}

/**
 * Fetches an anime avatar image URL directly from the independent anime API server.
 * The anime server is expected to respond with a redirect to the actual image,
 * or serve the image directly. The 'src' attribute of an <img> tag will handle this.
 * @param name - Optional name for avatar generation.
 * @param gender - Optional gender for avatar generation.
 * @param animeName - Optional anime name for avatar generation.
 * @returns The full URL to be used as the image source.
 */
export function getAnimeAvatarUrl(
  name?: string,
  gender?: 'male' | 'female',
  animeName?: string
): string {
  if (!ANIME_API_BASE_URL) {
    // Fallback or error handling if the base URL isn't configured
    // You might return a placeholder image URL or throw an error
    console.warn('Anime API base URL not configured, returning placeholder.');
    return '/placeholder-avatar.png'; // Ensure you have a placeholder in your public folder
  }

  const endpoint = `${ANIME_API_BASE_URL}/api/avatar`; // The path on your independent anime server
  const params = new URLSearchParams();
  if (name) params.append('_name', name);
  if (gender) params.append('_gender', gender);
  if (animeName) params.append('_animeName', animeName); // Changed from _anime to _animeName based on previous examples

  const queryString = params.toString();
  return `${endpoint}${queryString ? '?' + queryString : ''}`;
}

/**
 * Fetches the list of available anime directly from the independent anime API server.
 * @returns A promise that resolves to the anime list data.
 */
export async function fetchAnimeList(): Promise<any> { // Replace 'any' with a more specific type for your anime list
  if (!ANIME_API_BASE_URL) {
    throw new Error('Anime API base URL not configured.');
  }

  const endpoint = `${ANIME_API_BASE_URL}/api/animelist`; // The path on your independent anime server
  
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch anime list: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching anime list:', error);
    throw error; // Re-throw to be caught by the calling component
  }
}
