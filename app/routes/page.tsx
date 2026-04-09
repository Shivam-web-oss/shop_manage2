import ProfilePanel from "../components/profile-panel"

export default function RoutesPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-6 pt-14 pb-16">
      <div className="w-full max-w-6xl">
        <ProfilePanel />
      </div>
    </main>
  )
}