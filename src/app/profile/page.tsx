"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SideMenu from "@/components/SideMenu"
import { ClothingItemCard } from "@/components/ui/clothing-item-card"
import { supabase } from "@/lib/supabaseClient"
import { Modal } from "@/components/ui/modal"

interface ClothingItem {
  id: string
  Section: string
  Name: string
  Type: string
  Color: string
  Style: string
  Image: string
}

interface Outfit {
  id: string | number
  Top_Cloth_Id: string
  Bottom_Cloth_Id: string
  Shoes_Cloth_Id: string
}

interface OutfitWithClothes extends Outfit {
  topItem?: ClothingItem
  bottomItem?: ClothingItem
  shoesItem?: ClothingItem
}

interface UserProfile {
  id: string
  Name: string
  LastName: string
  Plan: string
  Email: string
}

export default function ProfilePage() {
  const [clothes, setClothes] = useState<ClothingItem[]>([])
  const [savedOutfits, setSavedOutfits] = useState<OutfitWithClothes[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedClothing, setSelectedClothing] = useState<ClothingItem | null>(null)
  const [color, setColor] = useState("")
  const [type, setType] = useState("")
  const [style, setStyle] = useState("")
  const [name, setName] = useState("")
  const [outfitModalOpen, setOutfitModalOpen] = useState(false)
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitWithClothes | null>(null)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchClothes()
      fetchOutfits()
    }
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        window.location.href = "/login"
        return
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, Name, LastName, Plan, Email")
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

  const fetchClothes = async () => {
    try {
      const { data, error } = await supabase.from("clothes").select("*").eq("User_Id", userId)
      if (error) throw error
      setClothes(data)
    } catch (error) {
      console.error("Error fetching clothes:", error)
      setError("Failed to fetch clothes. Please try again.")
    }
  }

  const fetchOutfits = async () => {
    try {
      const { data, error } = await supabase.from("saved_outfits").select("*").eq("User_Id", userId)
      if (error) throw error
      
      // Enriquecer outfits con datos de ropa
      const outfitsWithClothes = await Promise.all(
        data.map(async (outfit) => {
          const enrichedOutfit: OutfitWithClothes = { ...outfit }
          
          // Buscar piezas de ropa en el arreglo local de clothes
          if (outfit.Top_Cloth_Id) {
            enrichedOutfit.topItem = clothes.find(item => item.id === outfit.Top_Cloth_Id)
          }
          
          if (outfit.Bottom_Cloth_Id) {
            enrichedOutfit.bottomItem = clothes.find(item => item.id === outfit.Bottom_Cloth_Id)
          }
          
          if (outfit.Shoes_Cloth_Id) {
            enrichedOutfit.shoesItem = clothes.find(item => item.id === outfit.Shoes_Cloth_Id)
          }
          
          return enrichedOutfit
        })
      )
      
      setSavedOutfits(outfitsWithClothes)
    } catch (error) {
      console.error("Error fetching outfits:", error)
      setError("Failed to fetch outfits. Please try again.")
    }
  }

  useEffect(() => {
    // Actualizar los outfits cuando cambia el array de clothes
    if (clothes.length > 0 && savedOutfits.length > 0) {
      const updatedOutfits = savedOutfits.map(outfit => {
        const updatedOutfit = { ...outfit }
        
        if (outfit.Top_Cloth_Id) {
          updatedOutfit.topItem = clothes.find(item => item.id === outfit.Top_Cloth_Id)
        }
        
        if (outfit.Bottom_Cloth_Id) {
          updatedOutfit.bottomItem = clothes.find(item => item.id === outfit.Bottom_Cloth_Id)
        }
        
        if (outfit.Shoes_Cloth_Id) {
          updatedOutfit.shoesItem = clothes.find(item => item.id === outfit.Shoes_Cloth_Id)
        }
        
        return updatedOutfit
      })
      
      setSavedOutfits(updatedOutfits)
    }
  }, [clothes])

  const handleEditClothing = (clothing: ClothingItem) => {
    setSelectedClothing(clothing)
    setColor(clothing.Color)
    setType(clothing.Type)
    setStyle(clothing.Style)
    setName(clothing.Name)
    setModalOpen(true)
  }

  const handleSaveClothingChanges = async () => {
    if (selectedClothing) {
      try {
        const { data, error } = await supabase
          .from("clothes")
          .update({ Color: color, Type: type, Style: style, Name: name })
          .eq("id", selectedClothing.id)

        if (error) throw error
        setClothes((prevClothes) =>
          prevClothes.map((item) =>
            item.id === selectedClothing.id
              ? { ...item, Color: color, Type: type, Style: style, Name: name }
              : item
          )
        )
        setModalOpen(false)
      } catch (error) {
        console.error("Error saving clothing changes:", error)
        setError("Failed to save clothing changes.")
      }
    }
  }

  const handleDeleteClothing = async () => {
    if (selectedClothing) {
      try {
        const { data, error } = await supabase
          .from("clothes")
          .delete()
          .eq("id", selectedClothing.id)

        if (error) throw error
        setClothes((prevClothes) => prevClothes.filter((item) => item.id !== selectedClothing.id))
        setModalOpen(false)
      } catch (error) {
        console.error("Error deleting clothing:", error)
        setError("Failed to delete clothing.")
      }
    }
  }

  const handleOutfitClick = (outfit: OutfitWithClothes) => {
    setSelectedOutfit(outfit)
    setOutfitModalOpen(true)
  }

  const handleDeleteOutfit = async () => {
    if (selectedOutfit) {
      try {
        const { data, error } = await supabase
          .from("saved_outfits")
          .delete()
          .eq("id", selectedOutfit.id)

        if (error) throw error
        setSavedOutfits((prevOutfits) => prevOutfits.filter((outfit) => outfit.id !== selectedOutfit.id))
        setOutfitModalOpen(false)
      } catch (error) {
        console.error("Error deleting outfit:", error)
        setError("Failed to delete outfit.")
      }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/login" // Redirect to login after sign out
    } catch (error) {
      console.error("Error signing out:", error)
      setError("Failed to sign out. Please try again.")
    }
  }

  // Función auxiliar para generar un identificador de outfit seguro
  const getOutfitDisplayId = (id: string | number) => {
    if (typeof id === 'string') {
      return id.length > 4 ? id.slice(0, 4) : id;
    } else {
      return `#${id}`;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <SideMenu />
      <main className="flex-grow p-4 pt-16 pb-20">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Manage your account and subscription</CardDescription>
          </CardHeader>
          <CardContent>
            {userProfile && (
              <div className="space-y-4">
                <p>
                  <strong>Name:</strong> {userProfile.Name} {userProfile.LastName}
                </p>
                <p>
                  <strong>Email:</strong> {userProfile.Email}
                </p>
                <p>
                  <strong>Current Plan:</strong> {userProfile.Plan}
                </p>
                <Button className="" onClick={signOut} variant="outline">
                  Sign Out
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <Tabs defaultValue="clothes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clothes">Your Clothes</TabsTrigger>
            <TabsTrigger value="outfits">Saved Outfits</TabsTrigger>
          </TabsList>
          <TabsContent value="clothes">
            <div className="grid grid-cols-2 gap-4">
              {clothes.map((item) => (
                <ClothingItemCard
                  key={item.id}
                  id={item.id}
                  name={item.Name}
                  style={item.Style}
                  image={item.Image || "/placeholder.svg?height=100&width=100"}
                  onModify={() => handleEditClothing(item)}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="outfits">
            <div className="grid grid-cols-2 gap-4">
              {savedOutfits.map((outfit) => (
                <Card 
                  key={typeof outfit.id === 'string' ? outfit.id : `outfit-${outfit.id}`} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOutfitClick(outfit)}
                >
                  <CardContent className="p-4 relative h-48">
                    <div className="relative h-32 flex justify-center">
                      {/* Imágenes superpuestas para simular el outfit */}
                      {outfit.topItem && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-30 w-24 h-24">
                          <img 
                            src={outfit.topItem.Image || "/placeholder.svg?height=80&width=80"} 
                            alt={outfit.topItem.Name} 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      {outfit.bottomItem && (
                        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-20 w-24 h-24">
                          <img 
                            src={outfit.bottomItem.Image || "/placeholder.svg?height=80&width=80"} 
                            alt={outfit.bottomItem.Name} 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      {outfit.shoesItem && (
                        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 w-16 h-16">
                          <img 
                            src={outfit.shoesItem.Image || "/placeholder.svg?height=50&width=50"} 
                            alt={outfit.shoesItem.Name} 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal para Editar Ropa */}
      {modalOpen && selectedClothing && (
        <Modal onClose={() => setModalOpen(false)}>
          <div className="space-y-4 z-50">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="style">Style</Label>
              <Input
                id="style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
            </div>
            <div className="flex space-x-4">
              <Button onClick={handleSaveClothingChanges}>Save Changes</Button>
              <Button onClick={handleDeleteClothing} variant="outline">
                Delete Clothing
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal para Visualizar Outfit */}
      {outfitModalOpen && selectedOutfit && (
        <Modal onClose={() => setOutfitModalOpen(false)}>
          <div className="space-y-6 z-50">
            <h2 className="text-xl font-bold text-center">Outfit Details</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col items-center justify-center h-80 relative">
                {/* Top */}
                {selectedOutfit.topItem && (
                  <div className="absolute top-0 w-40 h-40">
                    <img 
                      src={selectedOutfit.topItem.Image || "/placeholder.svg?height=120&width=120"} 
                      alt={selectedOutfit.topItem.Name} 
                      className="object-contain w-full h-full"
                    />
                  </div>
                )}
                
                {/* Bottom */}
                {selectedOutfit.bottomItem && (
                  <div className="absolute top-32 w-40 h-40">
                    <img 
                      src={selectedOutfit.bottomItem.Image || "/placeholder.svg?height=120&width=120"} 
                      alt={selectedOutfit.bottomItem.Name} 
                      className="object-contain w-full h-full"
                    />
                  </div>
                )}
                
                {/* Shoes */}
                {selectedOutfit.shoesItem && (
                  <div className="absolute bottom-0 w-32 h-32">
                    <img 
                      src={selectedOutfit.shoesItem.Image || "/placeholder.svg?height=100&width=100"} 
                      alt={selectedOutfit.shoesItem.Name} 
                      className="object-contain w-full h-full"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button onClick={handleDeleteOutfit} variant="destructive">
                Delete Outfit
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}