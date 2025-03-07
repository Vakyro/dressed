// HomePage.tsx
"use client";

import { useUser } from "@/hooks/useUser";
import OutfitAIGenerator from "@/components/OutfitAIGenerator";
import OutfitRandomGenerator from "@/components/OutfitRandomGenerator";

export default function HomePage() {
  const { isLoggedIn, userProfile } = useUser();

  // Mientras el usuario y el perfil se están cargando, mostramos un mensaje o spinner
  if (!isLoggedIn || !userProfile) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      {userProfile.Plan === "Premium" ? (
        <OutfitAIGenerator />
      ) : (
        <OutfitRandomGenerator />
      )}
    </div>
  );
}
