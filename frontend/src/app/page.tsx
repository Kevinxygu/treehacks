import { auth0 } from "@/lib/auth0";
import LandingPage from "@/components/LandingPage";

export default async function Page() {
  const session = await auth0.getSession();
  const user = session?.user ?? null;

  return <LandingPage user={user} />;
}
