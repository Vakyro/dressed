import Image from "next/image"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ClothingItemCardProps {
  id: string
  name: string
  style: string
  image: string
  onModify: (id: string) => void
}

export function ClothingItemCard({ id, name, style, image, onModify }: ClothingItemCardProps) {
  return (
    <Card className="relative">
      <Button variant="ghost" size="icon" className="absolute top-1 right-1 z-10" onClick={() => onModify(id)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <CardContent className="p-2">
        <div className="aspect-square relative overflow-hidden rounded-md mb-2">
          <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
        </div>
        <h3 className="text-sm font-medium truncate">{name}</h3>
        <p className="text-xs text-muted-foreground">{style}</p>
      </CardContent>
    </Card>
  )
}

