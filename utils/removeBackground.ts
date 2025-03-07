import { removeBackground } from "@imgly/background-removal";

// Función para eliminar el fondo de una imagen en el lado del cliente
export const removeBackgroundClientSide = async (file: File): Promise<Blob | null> => {
  try {
    const processedImage = await removeBackground(file);
    return processedImage;
  } catch (error) {
    console.error("Error removing background:", error);
    return null;
  }
};
