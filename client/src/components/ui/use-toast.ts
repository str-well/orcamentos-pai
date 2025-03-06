import * as React from "react"
import { toast as sonnerToast, Toaster as Sonner } from "sonner"

const toastTypes = {
  default: sonnerToast,
  success: sonnerToast.success,
  error: sonnerToast.error,
  warning: sonnerToast.warning,
  info: sonnerToast.info,
}

type ToastProps = {
  title?: string
  description?: string
  variant?: keyof typeof toastTypes
}

export function toast({ title, description, variant = "default" }: ToastProps) {
  toastTypes[variant](description, {
    position: "bottom-right",
  })
}

export function Toaster() {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
    />
  )
} 