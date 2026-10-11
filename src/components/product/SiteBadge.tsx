import Badge from "@/components/ui/Badge";

const TONES: Record<string, "brand" | "info" | "success" | "warning" | "gray"> = {
  megapc: "brand",
  tunisianet: "info",
  sbs: "success",
  mytek: "warning",
  spacenet: "gray",
  skymil: "gray",
};

export default function SiteBadge({ site }: { site: string }) {
  const tone = TONES[site.toLowerCase()] ?? "gray";
  return <Badge tone={tone}>{site}</Badge>;
}