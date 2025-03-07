"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUp } from "lucide-react"
import SideMenu from "@/components/SideMenu"
import { supabase } from "@/lib/supabaseClient"
import { removeBackgroundClientSide } from "../../../utils/removeBackground"

interface UserProfile {
  id: string
  Name: string
  LastName: string
  Plan: string
}

export default function AddClothes() {
  const [section, setSection] = useState("")
  const [clothingName, setClothingName] = useState("")
  const [clothingType, setClothingType] = useState("")
  const [color, setColor] = useState("")
  const [style, setStyle] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null) // Para mantener la imagen antes de procesarla
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError

      const { data, error } = await supabase
        .from("users")
        .select("id, Name, LastName, Plan")
        .eq("auth_User_Id", user?.id)
        .single()

      if (error) throw error

      setUserProfile(data)
      setUserId(data.id)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setError("Failed to fetch user profile. Please try again.")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("") // Limpiamos cualquier error anterior
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file)) // Mostramos una vista previa de la imagen
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!imageFile) {
      setError("Please upload an image before submitting.")
      return
    }

    try {
      // Iniciamos el proceso de eliminación de fondo cuando el usuario da click en "Añadir ropa"
      setError("Processing image...") // Aviso en segundo plano, sin que el usuario vea la eliminación de fondo

      // Remueve el fondo de la imagen en el cliente
      const processedImage = await removeBackgroundClientSide(imageFile)
      if (!processedImage) {
        setError("Failed to remove background.")
        return
      }

      // Convierte el Blob en un File
      const fileName = `${userId}/${Date.now()}_${imageFile.name}`
      const processedFile = new File([processedImage], fileName, { type: processedImage.type })

      // Sube la imagen procesada a Supabase Storage
      const { data, error } = await supabase.storage
        .from("Clothes_Images")
        .upload(fileName, processedFile)

      if (error) throw error

      // Obtener la URL pública de la imagen
      const { data: publicUrlData } = supabase.storage
        .from("Clothes_Images")
        .getPublicUrl(fileName)

      setImagePreview(publicUrlData.publicUrl)
      setImageFile(null) // Limpiamos el archivo original
      setError("") // Limpiamos el error

      // Insertamos los datos de la ropa en la base de datos
      const { data: clothesData, error: clothesError } = await supabase.from("clothes").insert([
        {
          User_Id: userId,
          Section: section,
          Name: clothingName,
          Type: clothingType,
          Color: color,
          Style: style,
          Image: publicUrlData.publicUrl, // Guardamos la URL en la base de datos
        },
      ])

      if (clothesError) throw clothesError

      alert(`Added ${clothingName} to your ${section} collection!`)
      setSection("")
      setClothingName("")
      setClothingType("")
      setColor("")
      setStyle("")
      setImagePreview(null) // Limpiamos la vista previa
    } catch (error: any) {
      setError("Failed to process image. Please try again.")
      console.error("Error adding clothing item:", error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <SideMenu />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-2xl font-bold text-center">Add Clothes</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select clothing section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tops">Tops</SelectItem>
                <SelectItem value="bottoms">Bottoms</SelectItem>
                <SelectItem value="shoes">Shoes</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Clothing name"
              value={clothingName}
              onChange={(e) => setClothingName(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Clothing type"
              value={clothingType}
              onChange={(e) => setClothingType(e.target.value)}
              required
            />
            <Input type="text" placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} required />
            <Input type="text" placeholder="Style" value={style} onChange={(e) => setStyle(e.target.value)} required />
            <div className="flex items-center justify-center">
              <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                <ImageUp className="h-6 w-6" />
              </Button>
              <Input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
              />
            </div>
            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview || "/placeholder.svg"} alt="Clothing preview" className="max-w-full h-auto" />
              </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              Add Clothing
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
