"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/hooks/use-auth"

// Regular Users can contact an owner about a listing. There is no messaging
// backend in scope, so this records interest client-side and confirms — noted
// as a known limitation in the README.
export function ContactOwner({ title }: { title: string }) {
  const { user, hydrated } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")

  // Only Regular Users get this action.
  if (hydrated && user && user.role !== "USER") return null

  if (!user) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => router.push("/login")}
      >
        <Mail className="size-4" />
        Sign in to contact owner
      </Button>
    )
  }

  function send() {
    toast.success("Message sent to the owner", { description: "They'll get back to you by email." })
    setMessage("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="lg" className="w-full">
            <Mail className="size-4" />
            Contact owner
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact owner</DialogTitle>
          <DialogDescription>Ask about “{title}”.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, I'm interested in this property…"
            rows={4}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={send} disabled={message.trim().length < 2}>
            Send message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
