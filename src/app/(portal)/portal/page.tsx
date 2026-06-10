import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ListingCardProps {
  id: string;
  title: string;
  type: string;
  price: string;
  bedrooms: number;
}

const PlaceholderListingCard = ({ title, type, price, bedrooms }: ListingCardProps) => (
  <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
    <div className="bg-slate-200 h-48 flex items-center justify-center">
      <span className="text-slate-500">Image</span>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 mb-2">{type}</p>
      <div className="flex justify-between items-center mb-3">
        <span className="text-lg font-bold text-slate-900">{price}</span>
        <span className="text-sm text-slate-500">{bedrooms}BR</span>
      </div>
      <Button
        className="w-full"
        render={<Link href={`/portal/${title.toLowerCase().replace(/\s+/g, "-")}`} />}
      >
        View Details
      </Button>
    </div>
  </div>
);

export default function PortalHomePage() {
  return (
    <div>
      <section className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4a73] text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">Find Your Dream Home in the UAE</h1>
          <p className="text-xl text-slate-200 mb-8">
            Discover premium properties available for rent and sale
          </p>
          <div className="flex gap-4 max-w-2xl">
            <Input
              type="text"
              placeholder="Search by location, property type..."
              className="text-slate-900 bg-white"
            />
            <Button>Search</Button>
          </div>
        </div>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto my-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Public Portal Coming Soon</h2>
        <p className="text-slate-600 mb-6">
          We&apos;re building an enhanced public portal to help you search and discover
          properties more easily. In the meantime, our team is ready to assist you with any
          enquiries.
        </p>
        <div className="flex gap-4">
          <Button render={<a href="mailto:info@ddotsrealty.com" />}>Contact Us</Button>
          <Button variant="secondary" render={<a href="https://wa.me/971505555555" />}>
            WhatsApp
          </Button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Featured Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: "1", title: "Modern Apartment in Downtown", type: "Apartment", price: "AED 150,000/year", bedrooms: 2 },
            { id: "2", title: "Spacious Villa in Emirates Hills", type: "Villa", price: "AED 350,000/year", bedrooms: 4 },
            { id: "3", title: "Studio in Business Bay", type: "Studio", price: "AED 50,000/year", bedrooms: 0 },
          ].map((listing) => (
            <PlaceholderListingCard key={listing.id} {...listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
