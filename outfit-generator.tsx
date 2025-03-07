"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { Loader2, Menu } from "lucide-react"

interface UserProfile {
  id: string
  Name: string
  LastName: string
  Plan: string
  Email: string
}

interface OutfitItem {
  id: string
  Section: string
  Image: string
}

export default function OutfitGenerator() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [outfitPrompt, setOutfitPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const [outfitImages, setOutfitImages] = useState<{ top: string | null; bottom: string | null; shoes: string | null }>(
    {
      top: null,
      bottom: null,
      shoes: null,
    },
  )

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        fetchUserProfile(user.id)
      } else {
        router.push("/login")
      }
    }

    checkUser()
  }, [router])

  const fetchUserProfile = async (authUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, Name, LastName, Plan, Email")
        .eq("auth_User_Id", authUserId)
        .single()

      if (error) throw error

      setUserProfile(data)
      setUserId(data.id)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleGenerate = async () => {
    if (!userId || !outfitPrompt.trim()) return

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: outfitPrompt, userId }),
      })

      if (!response.ok) throw new Error("Failed to generate outfit")

      const outfit = await response.json()

      setOutfitImages({
        top: outfit.top?.Image || null,
        bottom: outfit.bottom?.Image || null,
        shoes: outfit.shoes?.Image || null,
      })

      toast({
        title: "Outfit Generated",
        description: "Your AI-powered outfit has been created!",
      })
    } catch (error) {
      console.error("Error generating outfit:", error)
      toast({
        title: "Error",
        description: "Failed to generate outfit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Placeholder for SideMenu */}
      <div className="p-4 bg-white shadow-md">
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menu</span>
        </Button>
      </div>
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-center">AI Outfit Generator</h1>
            <div className="space-y-4">
              <Input
                placeholder="Describe your outfit needs (e.g., 'outfit for a beach day')"
                value={outfitPrompt}
                onChange={(e) => setOutfitPrompt(e.target.value)}
                className="w-full"
              />
              <Button
                onClick={handleGenerate}
                size="lg"
                className="w-full"
                disabled={isGenerating || !outfitPrompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Outfit"
                )}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {["top", "bottom", "shoes"].map((section) => (
                <div key={section} className="flex flex-col items-center">
                  <h2 className="text-lg font-semibold mb-2 capitalize">{section}</h2>
                  {outfitImages[section as keyof typeof outfitImages] ? (
                    <img
                      src={outfitImages[section as keyof typeof outfitImages]! || "/placeholder.svg"}
                      alt={`${section} item`}
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

