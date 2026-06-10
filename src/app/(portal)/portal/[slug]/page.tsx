import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PortalListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link href="/portal" className="text-primary hover:underline mb-6 inline-block">
        ← Back to Listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-slate-200 h-96 rounded-lg flex items-center justify-center mb-8">
            <span className="text-slate-500 text-lg">Property Image</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Listing: {slug}</h1>
          <p className="text-slate-600 mb-6">Public listing detail page coming soon.</p>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-50 rounded-lg p-6 sticky top-4">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Price on request</h3>
            <div className="space-y-3">
              <Button className="w-full">Enquire Now</Button>
              <Button variant="secondary" className="w-full">Contact Agent</Button>
            </div>
            <div className="border-t mt-6 pt-6 space-y-2 text-sm text-slate-600">
              <p><strong>Phone:</strong> +971 50 555 5555</p>
              <p><strong>Email:</strong> info@ddotsrealty.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
