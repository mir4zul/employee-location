export default function GoogleMapIframe({ lat, lng }) {
  if (!lat || !lng) return null;

  const src = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <div className="w-full max-w-md h-64 rounded-lg overflow-hidden border">
      <iframe
        title="location-map"
        src={src}
        width="100%"
        height="100%"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
