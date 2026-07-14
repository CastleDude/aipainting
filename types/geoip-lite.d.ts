declare module "geoip-lite" {
  interface LookupResult {
    country: string;
    region: string;
    city: string;
    ll: [number, number];
    range: [number, number];
  }
  function lookup(ip: string): LookupResult | null;
}
