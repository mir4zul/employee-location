import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

export default function GoogleLocationMap({ location, address }) {
  if (!location) return <p>Loading map...</p>;

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_API_KEY">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "400px" }}
        center={location}
        zoom={17}
      >
        <Marker position={location} />
      </GoogleMap>
      {address && <p className="mt-2 text-gray-700">Address: {address}</p>}
    </LoadScript>
  );
}
