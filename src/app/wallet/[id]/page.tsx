import type { Metadata } from "next";
import { WalletDashboard } from "@/components/WalletDashboard";

export const metadata: Metadata = {
  title: "Carteira — Digital Wallet",
};

export default async function WalletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WalletDashboard walletId={id} />;
}
