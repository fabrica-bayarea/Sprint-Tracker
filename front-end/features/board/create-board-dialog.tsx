"use client";

import { useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui";
import { createBoard } from "@/lib/actions/board";
import { toast } from "sonner";

interface CreateBoardDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBoardDialog({ isOpen, onClose }: CreateBoardDialogProps) {
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createBoard({ title: name, description });

    if (result.success) {
      setName("");
      setDescription("");
      setImage(null);
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      onClose();
    } else {
      toast.error(result.error || "Unknown error");
    }

    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="md:max-w-175 p-6">
        <DialogHeader>
          <DialogTitle>Criar um espaço de trabalho</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Nome" 
            type="text"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <Textarea
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Imagem</span>
            <div className="w-25 h-25 border rounded-md flex items-center justify-center overflow-hidden">
              {image ? (
                <Image src={URL.createObjectURL(image)} alt="Preview" width={100} height={100} className="object-cover" />
              ) : (
                <span className="text-muted-foreground text-sm">Preview</span>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
          </div>
          <button type="submit" disabled={loading} className="bg-[#C01010] text-primary-foreground py-2 rounded-md font-medium mt-2">
            {loading ? "Criando" : "Criar"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}