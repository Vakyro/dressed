"use client"

import { ReactNode } from "react"
import { Button } from "./button"
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogDescription, DialogClose } from "@radix-ui/react-dialog"

interface ModalProps {
  children: ReactNode
  onClose: () => void
}

export const Modal = ({ children, onClose }: ModalProps) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 bg-black opacity-50" />
      <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-96 z-50">
        <DialogTitle className="text-xl font-semibold mb-4">Edit Clothing</DialogTitle>
        <DialogDescription>{children}</DialogDescription>
        <div className="mt-4 flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
