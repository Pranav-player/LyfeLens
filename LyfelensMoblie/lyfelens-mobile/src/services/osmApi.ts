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
  distance: string;
  phone?: string;
  lat?: number;
  lon?: number;
};

type FacilityWithDistance = Facility & {
  distanceMeters: number;
};

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
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
    out body 80;
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
    const facilitiesWithDistance: FacilityWithDistance[] = data.elements
      .filter((el: OSMNode) => el.tags && el.tags.name)
      .map((el: OSMNode) => {
        const distanceMeters = getDistanceMeters(lat, lon, el.lat, el.lon);
        return {
          id: String(el.id),
          name: el.tags.name || 'Unknown Medical Center',
          type: el.tags.amenity === 'hospital' ? 'Hospital' : 'Clinic / Doctor',
          distance: formatDistance(distanceMeters),
          phone: el.tags.phone || 'N/A',
          lat: el.lat,
          lon: el.lon,
          distanceMeters,
        };
      })
      .sort((a: FacilityWithDistance, b: FacilityWithDistance) => a.distanceMeters - b.distanceMeters);

    const facilities: Facility[] = facilitiesWithDistance.map(({ distanceMeters, ...facility }: FacilityWithDistance) => facility);

    return facilities.length > 0 ? facilities : getFallbackData();
  } catch (error) {
    console.warn("Failed to fetch live OSM facilities, falling back to mock data.", error);
    return getFallbackData();
  }
};

// If offline or Overpass rate limits (which is common for free tiers), provide beautiful mock data
const getFallbackData = (): Facility[] => [
  { id: '1', name: 'City Central Hospital', type: 'Hospital', distance: '1.2 km', phone: '112', lat: 28.6211, lon: 77.2183 },
  { id: '2', name: 'Dr. Smith Orthopedics', type: 'Specialist Clinic', distance: '2.5 km', phone: '+91 9876543210', lat: 28.6066, lon: 77.2294 },
  { id: '3', name: 'Sunrise Emergency Care', type: 'Hospital', distance: '3.8 km', phone: '+91 9876543211', lat: 28.5984, lon: 77.2021 },
];
