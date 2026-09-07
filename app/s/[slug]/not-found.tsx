export default function StorefrontNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Shop not found</h1>
      <p className="max-w-sm text-sm text-muted">
        This storefront link is wrong or the shop has moved. Check the address, or ask
        the seller for their current link.
      </p>
    </main>
  );
}
