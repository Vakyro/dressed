"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import SideMenu from "@/components/SideMenu";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { getRandomItem } from "@/utils/outfitUtils";

interface OutfitImages {
  top: string | null;
  bottom: string | null;
  shoes: string | null;
}

export default function OutfitRandomGenerator() {
  const { isLoggedIn, userId } = useUser();
  const [outfitImages, setOutfitImages] = useState<OutfitImages>({
    top: null,
    bottom: null,
    shoes: null,
  });

  const handleGenerate = async () => {
    if (!userId) {
      console.error("User ID not available yet");
      return;
    }
    
    // Se consulta una sola vez la ropa del usuario (limitando las columnas)
    const { data: clothes, error } = await supabase
      .from("clothes")
      .select("id, Section, Image")
      .eq("User_Id", userId);

    if (error || !clothes) {
      console.error("Error fetching clothes:", error);
      return;
    }

    // Filtrar prendas por sección y seleccionar una al azar usando la función utilitaria
    const topClothes = clothes.filter((item) => item.Section === "top");
    const bottomClothes = clothes.filter((item) => item.Section === "bottom");
    const shoesClothes = clothes.filter((item) => item.Section === "shoes");

    const randomTop = topClothes.length ? getRandomItem(topClothes) : null;
    const randomBottom = bottomClothes.length ? getRandomItem(bottomClothes) : null;
    const randomShoes = shoesClothes.length ? getRandomItem(shoesClothes) : null;

    setOutfitImages({
      top: randomTop ? randomTop.Image : null,
      bottom: randomBottom ? randomBottom.Image : null,
      shoes: randomShoes ? randomShoes.Image : null,
    });
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <SideMenu />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="space-y-8 text-center">
          <h1 className="text-2xl font-bold">Outfit Generator</h1>
          <div className="flex flex-col items-center space-y-6">
            {outfitImages.top ? (
              <img
                src={outfitImages.top}
                alt="Top"
                className="w-32 h-32 object-cover rounded-lg"
              />
            ) : (
              // Placeholder (código SVG copiado del original)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={128}
                height={128}
                fill="none"
                className="text-gray-300"
              >
                <path
                  d="M6 9V16.6841C6 18.4952 6 19.4008 6.58579 19.9635C7.89989 21.2257 15.8558 21.4604 17.4142 19.9635C18 19.4008 18 18.4952 18 16.6841V9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M5.74073 12L3.04321 9.38915C2.34774 8.71602 2 8.37946 2 7.96123C2 7.543 2.34774 7.20644 3.04321 6.53331L5.04418 4.59664C5.39088 4.26107 5.56423 4.09329 5.77088 3.96968C5.97753 3.84607 6.21011 3.77103 6.67526 3.62096L8.32112 3.08997C8.56177 3.01233 8.68209 2.97351 8.76391 3.02018C8.84573 3.06686 8.87157 3.2013 8.92324 3.47018C9.19358 4.87684 10.4683 5.94185 12 5.94185C13.5317 5.94185 14.8064 4.87684 15.0768 3.47018C15.1284 3.2013 15.1543 3.06686 15.2361 3.02018C15.3179 2.97351 15.4382 3.01233 15.6789 3.08997L17.3247 3.62096C17.7899 3.77103 18.0225 3.84607 18.2291 3.96968C18.4358 4.09329 18.6091 4.26107 18.9558 4.59664L20.9568 6.53331C21.6523 7.20644 22 7.543 22 7.96123C22 8.37946 21.6523 8.71602 20.9568 9.38915L18.2593 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {outfitImages.bottom ? (
              <img
                src={outfitImages.bottom}
                alt="Bottom"
                className="w-32 h-32 object-cover rounded-lg"
              />
            ) : (
              // Placeholder (SVG copiado del original)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={128}
                height={128}
                fill="none"
                className="text-gray-300"
              >
                <path
                  d="M18.1604 5V4C18.1604 3.05719 18.1604 2.58579 17.8596 2.29289C17.5589 2 17.0749 2 16.1069 2H7.8931C6.92509 2 6.44109 2 6.14037 2.29289C5.83965 2.58579 5.83965 3.05719 5.83965 4V5M18.1604 5L20.8152 19.6524C21.0124 20.7411 21.1111 21.2855 20.8033 21.6427C20.4956 22 19.928 22 18.793 22H17.6235C16.8926 22 16.5272 22 16.2552 21.8044C15.9833 21.6088 15.8758 21.2686 15.6609 20.5882L13.9626 15.2126C13.1598 12.6711 12.7583 11.4004 12 11.4004C11.2417 11.4004 10.8402 12.6711 10.0374 15.2126L8.33912 20.5882C8.12417 21.2686 8.01669 21.6088 7.74476 21.8044C7.47284 22 7.10738 22 6.37647 22H5.20702C4.07196 22 3.50443 22 3.19668 21.6427C2.88893 21.2855 2.98756 20.7411 3.18482 19.6524L5.83965 5M18.1604 5H5.83965"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M10 7.77778L12 5L15 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {outfitImages.shoes ? (
              <img
                src={outfitImages.shoes}
                alt="Shoes"
                className="w-32 h-32 object-cover rounded-lg"
              />
            ) : (
              // Placeholder (SVG copiado del original)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={128}
                height={128}
                fill="none"
                className="text-gray-300"
              >
                <path
                  d="M19.1012 18H7.96299C5.02913 18 3.56221 18 2.66807 16.8828C0.97093 14.7623 2.9047 9.1238 4.07611 7C4.47324 9.4 8.56152 9.33333 10.0507 9C9.05852 7.00119 10.3831 6.33413 11.0453 6.00059L11.0465 6C14 9.5 20.3149 11.404 21.8624 15.2188C22.5309 16.8667 20.6262 18 19.1012 18Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 14C6.16467 15.4294 8.73097 15.8442 12.0217 14.8039C13.0188 14.4887 13.5174 14.3311 13.8281 14.3525C14.1389 14.3739 14.7729 14.6695 16.0408 15.2608C17.6243 15.9992 19.7971 16.4243 22 15.3583"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.5 9.5L15 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.5 11L17 9.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <div className="flex flex-col items-center space-y-4">
            <Button onClick={handleGenerate} size="lg" className="w-full max-w-xs">
              Generate Outfit
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
