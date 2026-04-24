import PublicWelcome from "@/app/components/public/public-welcome"

export const metadata = {
  title: "Welcome",
  description: "Welcome to ShopManager and choose whether to log in or create a new workspace.",
}

export default function LandingPage() {
  return <PublicWelcome />
}
