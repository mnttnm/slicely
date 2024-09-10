"use client"

import * as React from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command"
import { useFileUpload } from "@/app/hooks/useFileUpload"
import { useTheme } from "next-themes"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const { uploadFile } = useFileUpload()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { setTheme, theme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => runCommand(() => {
                fileInputRef.current?.click()
              })}
            >
              Upload PDF
            </CommandItem>
            <CommandItem onSelect={() => runCommand(toggleTheme)}>
              Toggle Theme
            </CommandItem>
            {/* Add more command items here */}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  )
}
