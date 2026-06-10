"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppButtonProps {
  phone?: string | null;
  message?: string;
  label?: string;
  size?: "sm" | "default" | "lg";
  onClick?: () => void;
  className?: string;
}

export function WhatsAppButton({
  phone,
  message = "",
  label = "WhatsApp",
  size = "default",
  onClick,
  className,
}: WhatsAppButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (phone) {
      const phoneDigitsOnly = phone.replace(/\D/g, "");
      const url = `https://wa.me/${phoneDigitsOnly}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    }
  };

  const disabled = !phone && !onClick;

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={`gap-2 ${className ?? ""}`}
    >
      <MessageCircle className="h-4 w-4 text-success" />
      {label}
    </Button>
  );
}
