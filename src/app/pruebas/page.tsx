"use client";

import React, { useState, useEffect } from "react";
import SideMenu from "@/components/SideMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { getRandomItem } from "@/utils/outfitUtils";
import { Send, Heart } from "lucide-react";

// Definición de la prenda (simplificada)
interface ClothingItem {
  id: string;
  Image: string;
  Section: string;
  // Otros campos opcionales...
}

export default function OutfitGenerator() {
  const { isLoggedIn, userId } = useUser();

  // Estados para las listas de prendas (carouseles)
  const [topItems, setTopItems] = useState<ClothingItem[]>([]);
  const [bottomItems, setBottomItems] = useState<ClothingItem[]>([]);
  const [shoesItems, setShoesItems] = useState<ClothingItem[]>([]);

  // Índices para cada carrusel (0 = placeholder)
  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const [shoesIndex, setShoesIndex] = useState(0);

  // Estados para el generador
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedOutfitId, setSavedOutfitId] = useState<string | null>(null);

  // A partir de los carruseles e índices, se derivan los IDs seleccionados
  const selectedClothesIds = {
    topId: topIndex === 0 ? null : topItems[topIndex]?.id,
    bottomId: bottomIndex === 0 ? null : bottomItems[bottomIndex]?.id,
    shoesId: shoesIndex === 0 ? null : shoesItems[shoesIndex]?.id,
  };

  // Para mostrar las imágenes (si el índice es 0 se muestra el placeholder, de lo contrario la imagen)
  const shirt = topIndex === 0 ? null : topItems[topIndex]?.Image;
  const pants = bottomIndex === 0 ? null : bottomItems[bottomIndex]?.Image;
  const shoes = shoesIndex === 0 ? null : shoesItems[shoesIndex]?.Image;

  // Función para agregar un placeholder (los SVG no tienen imagen, se renderiza el componente)
  // Se usarán en el render directamente.

  // Se carga la lista completa de prendas del usuario para cada categoría y se agrega al inicio un "placeholder"
  useEffect(() => {
    if (!userId) return;
    const fetchClothes = async () => {
      const { data, error } = await supabase
        .from("clothes")
        .select("id, Section, Image, Name, Color, Type, Style")
        .eq("User_Id", userId);
      if (error) {
        console.error("Error fetching clothes", error);
        return;
      }
      if (data) {
        // Filtrar por sección y ordenarlos de forma aleatoria
        const tops = data.filter((item: any) => item.Section === "top");
        const bottoms = data.filter((item: any) => item.Section === "bottom");
        const shoesArr = data.filter((item: any) => item.Section === "shoes");

        // Función para mezclar (Fisher-Yates)
        function shuffle<T>(array: T[]): T[] {
          let arr = [...array];
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
        }

        const shuffledTops = shuffle(tops);
        const shuffledBottoms = shuffle(bottoms);
        const shuffledShoes = shuffle(shoesArr);

        // Se agrega el "placeholder" al inicio de cada arreglo
        setTopItems([{ id: "placeholder-top", Image: "", Section: "top" }, ...shuffledTops]);
        setBottomItems([{ id: "placeholder-bottom", Image: "", Section: "bottom" }, ...shuffledBottoms]);
        setShoesItems([{ id: "placeholder-shoes", Image: "", Section: "shoes" }, ...shuffledShoes]);
      }
    };
    fetchClothes();
  }, [userId]);

  // Verificar si el outfit actual ya está guardado
  useEffect(() => {
    const checkIfOutfitSaved = async () => {
      if (!userId || !selectedClothesIds.topId || !selectedClothesIds.bottomId || !selectedClothesIds.shoesId) {
        setIsSaved(false);
        setSavedOutfitId(null);
        return;
      }
      const { data, error } = await supabase
        .from("saved_outfits")
        .select("id")
        .eq("User_Id", userId)
        .eq("Top_Cloth_Id", selectedClothesIds.topId)
        .eq("Bottom_Cloth_Id", selectedClothesIds.bottomId)
        .eq("Shoes_Cloth_Id", selectedClothesIds.shoesId)
        .single();
      if (error) {
        setIsSaved(false);
        setSavedOutfitId(null);
      } else if (data) {
        setIsSaved(true);
        setSavedOutfitId(data.id);
      }
    };

    checkIfOutfitSaved();
  }, [userId, selectedClothesIds]);

  // Genera el outfit usando AI
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      console.error("User ID not available yet");
      return;
    }
    if (!prompt.trim()) {
      console.error("Prompt is empty");
      return;
    }
    setLoading(true);

    // Consulta las prendas del usuario para formatear el prompt
    const { data: clothes, error } = await supabase
      .from("clothes")
      .select("id, Name, Color, Type, Style, Section, Image")
      .eq("User_Id", userId);
    if (error || !clothes) {
      console.error("Error fetching clothes:", error);
      setLoading(false);
      return;
    }
    const formattedClothes = clothes
      .map(
        (item: any) =>
          `${item.id}: ${item.Name} (${item.Section}): ${item.Color}, ${item.Style}, ${item.Type}`
      )
      .join("\n");

    const fullPrompt = `
      USER PROMPT: "${prompt}"
      USER'S CLOTHING ITEMS:
      ${formattedClothes}

      INSTRUCTIONS:
      1. Generate an outfit using the user's clothing items.
      2. Return the outfit as JSON: { "top": "id", "bottom": "id", "shoes": "id" }
      3. Only respond with the JSON, no extra text.
    `;
    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt }),
      });
      if (!res.ok) {
        throw new Error(`API responded with status: ${res.status}`);
      }
      const result = await res.json();
      if (!result.response) {
        throw new Error("No response received from API");
      }
      console.log("API response:", result.response);
      const parsed = JSON.parse(result.response);
      const { top, bottom, shoes } = parsed;
      // Actualizar los índices de cada carrusel buscando la prenda cuyo id coincida (ignorar placeholder)
      const newTopIndex = topItems.findIndex((item, idx) => idx > 0 && item.id === top);
      const newBottomIndex = bottomItems.findIndex((item, idx) => idx > 0 && item.id === bottom);
      const newShoesIndex = shoesItems.findIndex((item, idx) => idx > 0 && item.id === shoes);
      if (newTopIndex !== -1) setTopIndex(newTopIndex);
      if (newBottomIndex !== -1) setBottomIndex(newBottomIndex);
      if (newShoesIndex !== -1) setShoesIndex(newShoesIndex);
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para generar outfit aleatorio
  const generateRandomOutfit = async () => {
    if (!userId) {
      console.error("User ID not available yet");
      return;
    }
    setLoading(true);
    if (topItems.length > 1) {
      const randomTop = Math.floor(Math.random() * (topItems.length - 1)) + 1;
      setTopIndex(randomTop);
    }
    if (bottomItems.length > 1) {
      const randomBottom = Math.floor(Math.random() * (bottomItems.length - 1)) + 1;
      setBottomIndex(randomBottom);
    }
    if (shoesItems.length > 1) {
      const randomShoes = Math.floor(Math.random() * (shoesItems.length - 1)) + 1;
      setShoesIndex(randomShoes);
    }
    setLoading(false);
  };

  const handleSaveOutfit = async () => {
    if (!userId) {
      console.error("User ID not available yet");
      return;
    }
    // Si ya está guardado, eliminar
    if (isSaved && savedOutfitId) {
      const { error } = await supabase
        .from("saved_outfits")
        .delete()
        .eq("id", savedOutfitId);
      if (error) {
        console.error("Error removing outfit:", error);
        return;
      }
      setIsSaved(false);
      setSavedOutfitId(null);
      return;
    }
    // Asegurarse de que se han seleccionado prendas (los placeholders no cuentan)
    if (!selectedClothesIds.topId || !selectedClothesIds.bottomId || !selectedClothesIds.shoesId) {
      console.error("Incomplete outfit cannot be saved");
      return;
    }
    const { data, error } = await supabase
      .from("saved_outfits")
      .insert([
        {
          User_Id: userId,
          Top_Cloth_Id: selectedClothesIds.topId,
          Bottom_Cloth_Id: selectedClothesIds.bottomId,
          Shoes_Cloth_Id: selectedClothesIds.shoesId,
        },
      ])
      .select();
    if (error) {
      console.error("Error saving outfit:", error);
      return;
    }
    if (data && data.length > 0) {
      setIsSaved(true);
      setSavedOutfitId(data[0].id);
    }
  };

  // Los SVG placeholders originales
  const TopPlaceholder = () => (
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
  );

  const BottomPlaceholder = () => (
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
  );

  const ShoesPlaceholder = () => (
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
  );

  if (!isLoggedIn) return null;

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gray-100 p-4">
      <SideMenu />
      <h1 className="text-2xl font-bold mt-4">AI Outfit Generator</h1>
      <div className="flex flex-col items-center space-y-8 w-full max-w-xs">
        {/* Sección de carruseles (Top, Bottom, Shoes) con el diseño original */}
        <div className="flex flex-col items-center space-y-8 w-full">
          {/* Top */}
          <div className="flex flex-col items-center relative">
            <button
              onClick={() => {
                if (topItems.length > 0)
                  setTopIndex((prev) => (prev - 1 + topItems.length) % topItems.length);
              }}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow p-1 z-10"
            >
              {"<"}
            </button>
            <div className="flex flex-col items-center">
              {topIndex === 0 ? (
                <TopPlaceholder />
              ) : (
                <img
                  src={topItems[topIndex].Image}
                  alt="Top"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
            </div>
            <button
              onClick={() => {
                if (topItems.length > 0)
                  setTopIndex((prev) => (prev + 1) % topItems.length);
              }}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow p-1 z-10"
            >
              {">"}
            </button>
          </div>
          {/* Bottom */}
          <div className="flex flex-col items-center relative">
            <button
              onClick={() => {
                if (bottomItems.length > 0)
                  setBottomIndex((prev) => (prev - 1 + bottomItems.length) % bottomItems.length);
              }}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow p-1 z-10"
            >
              {"<"}
            </button>
            <div className="flex flex-col items-center">
              {bottomIndex === 0 ? (
                <BottomPlaceholder />
              ) : (
                <img
                  src={bottomItems[bottomIndex].Image}
                  alt="Bottom"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
            </div>
            <button
              onClick={() => {
                if (bottomItems.length > 0)
                  setBottomIndex((prev) => (prev + 1) % bottomItems.length);
              }}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow p-1 z-10"
            >
              {">"}
            </button>
          </div>
          {/* Shoes */}
          <div className="flex flex-col items-center relative">
            <button
              onClick={() => {
                if (shoesItems.length > 0)
                  setShoesIndex((prev) => (prev - 1 + shoesItems.length) % shoesItems.length);
              }}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow p-1 z-10"
            >
              {"<"}
            </button>
            <div className="flex flex-col items-center">
              {shoesIndex === 0 ? (
                <ShoesPlaceholder />
              ) : (
                <img
                  src={shoesItems[shoesIndex].Image}
                  alt="Shoes"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
            </div>
            <button
              onClick={() => {
                if (shoesItems.length > 0)
                  setShoesIndex((prev) => (prev + 1) % shoesItems.length);
              }}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow p-1 z-10"
            >
              {">"}
            </button>
          </div>
        </div>
        {/* Formulario para generar outfit con AI */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2 w-full">
          <Input
            type="text"
            placeholder="Enter outfit prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-grow text-sm"
          />
          <Button type="submit" size="icon" className="h-10 w-10" disabled={loading}>
            <Send className="w-4 h-4" />
            <span className="sr-only">Generate Outfit</span>
          </Button>
        </form>
      </div>
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
        <Button
          type="button"
          onClick={generateRandomOutfit}
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 p-0"
          disabled={loading}
        >
          {/* SVG de dado (copiado del original) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="128"
            height="128"
            fill="currentColor"
            className="bi bi-dice-5 m-0"
            viewBox="0 0 16 16"
          >
            <path d="M13 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zM3 0a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V3a3 3 0 0 0-3-3z" />
            <path d="M5.5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m8 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m-8 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m4-4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
          </svg>
          <span className="sr-only">Random Outfit</span>
        </Button>
      </div>
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
        <Button
          type="button"
          onClick={handleSaveOutfit}
          variant="outline"
          size="icon"
          className={`rounded-full w-12 h-12 p-0 ${isSaved ? "bg-red-100" : ""}`}
          disabled={!selectedClothesIds.topId || !selectedClothesIds.bottomId || !selectedClothesIds.shoesId}
        >
          <Heart className={`w-4 h-4 ${isSaved ? "text-red-500 fill-red-500" : ""}`} />
          <span className="sr-only">{isSaved ? "Remove from Saved" : "Save Outfit"}</span>
        </Button>
      </div>
    </div>
  );
}
