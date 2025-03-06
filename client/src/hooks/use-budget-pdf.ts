import { Budget } from "@shared/schema";
import { useState } from "react";
import { useToast } from "./use-toast";
import { supabase } from "@/lib/supabase";

export const useBudgetPdf = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePdf = async (budget: Budget) => {
    try {
      setIsGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`https://dbxabmijgyxuazvdelpx.supabase.co/functions/v1/generate-budget-pdf/${budget.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar PDF');
      }

      const data = await response.json();

      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      } else {
        throw new Error('URL do PDF não disponível');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePdf,
    isGenerating
  };
}; 