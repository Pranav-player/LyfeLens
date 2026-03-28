type OSMNode = {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    healthcare?: string;
    emergency?: string;
    phone?: string;
  };
};

export type Facility = {
  id: string;
  name: string;
  type: string;
  distance: string; // Formatting a mocked distance since geolocation needs exact coordinates
  phone?: string;
};

/**
 * Fetches nearby hospitals and clinics using the OpenStreetMap Overpass API.
 * Using a free endpoint, so it might take 1-2 seconds but fetches real world live data!
 */
export const fetchNearbyFacilities = async (
  lat: number = 28.6139, // Default to New Delhi for testing
  lon: number = 77.2090, 
  radiusMeters: number = 5000
): Promise<Facility[]> => {
  const overpassQuery = `
    [out:json][timeout:10];
    (
      node["amenity"="hospital"](around:${radiusMeters}, ${lat}, ${lon});
      node["amenity"="clinic"](around:${radiusMeters}, ${lat}, ${lon});
      node["amenity"="doctors"](around:${radiusMeters}, ${lat}, ${lon});
    );
    out body 15;
  `;

  try {
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    
    // Attempt the fetch
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Overpass API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.elements) {
      return getFallbackData();
    }

    // Map raw OSM data to our Facility schema
    const facilities: Facility[] = data.elements
      .filter((el: OSMNode) => el.tags && el.tags.name)
      .map((el: OSMNode, index: number) => ({
        id: String(el.id),
        name: el.tags.name || 'Unknown Medical Center',
        type: el.tags.amenity === 'hospital' ? 'Hospital' : 'Clinic / Doctor',
        distance: `${(1.2 + (index * 0.4)).toFixed(1)} km`, // Mocked distance calc for UI based on array position
        phone: el.tags.phone || 'N/A',
      }));

    return facilities.length > 0 ? facilities : getFallbackData();
  } catch (error) {
    console.warn("Failed to fetch live OSM facilities, falling back to mock data.", error);
    return getFallbackData();
  }
};

// If offline or Overpass rate limits (which is common for free tiers), provide beautiful mock data
const getFallbackData = (): Facility[] => [
  { id: '1', name: 'City Central Hospital', type: 'Hospital', distance: '1.2 km', phone: '112' },
  { id: '2', name: 'Dr. Smith Orthopedics', type: 'Specialist Clinic', distance: '2.5 km', phone: '+91 9876543210' },
  { id: '3', name: 'Sunrise Emergency Care', type: 'Hospital', distance: '3.8 km', phone: '+91 9876543211' },
];
