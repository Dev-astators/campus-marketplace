// Read-only content block shown when the owner is not editing.
export default function ListingReadOnlyDetails({ listing }) {
  return (
    <>
      <p className="mt-4 text-gray-700">{listing.description}</p>
      <p className="mt-2 font-semibold text-lg">R{listing.price}</p>
      <p className="text-sm text-gray-500">{listing.condition}</p>
      <p className="text-sm text-gray-500">{listing.category}</p>
      <p className="text-sm text-gray-500">{listing.listing_type}</p>
    </>
  );
}
