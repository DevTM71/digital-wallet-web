import { AccessWalletCard } from "@/components/AccessWalletCard";
import { OpenWalletCard } from "@/components/OpenWalletCard";
import { RecentWallets } from "@/components/RecentWallets";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:py-20">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          💳 Digital Wallet
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Interface web da{" "}
          <a
            href="https://github.com/DevTM71/digital-wallet-api"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 underline underline-offset-4 hover:text-indigo-500 dark:text-indigo-400"
          >
            digital-wallet-api
          </a>{" "}
          — uma carteira digital com Event Sourcing.
        </p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2">
        <OpenWalletCard />
        <AccessWalletCard />
      </div>
      <RecentWallets />
    </main>
  );
}
