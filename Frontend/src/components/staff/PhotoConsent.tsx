import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api, tokenStore } from "@/lib/api";

interface PhotoConsentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: () => void;
}

export function PhotoConsent({ open, onOpenChange, onConsent }: PhotoConsentProps) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isMarathi = i18n.language === "mr";

  const handleConsent = async () => {
    setLoading(true);
    try {
      if (tokenStore.access()) {
        await api.post("/me/photo-consent");
      }
      onConsent();
      onOpenChange(false);
    } catch (err: any) {
      console.warn("Photo consent error:", err?.message);
      // Still allow local proceed
      onConsent();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <DialogTitle className="text-center text-lg font-semibold">
            {isMarathi ? "फोटो गोपनीयता आणि संमती" : "Photo Privacy & Consent"}
          </DialogTitle>
          <DialogDescription className="space-y-2 text-center text-xs leading-relaxed text-muted-foreground">
            <p>
              {isMarathi
                ? "तुमचे छायाचित्रे केवळ पृष्ठ क्रमांक आणि वाचन प्रगती पडताळण्यासाठी वापरले जातात. कृत्रिम बुद्धिमत्ता (AI) आणि प्रशासकीय पुनरावलोकनानंतर 7 दिवसांच्या आत सर्व फोटो कायमचे हटवले जातात."
                : "Photos uploaded as reading proof are used strictly to verify page numbers and validate progress. All photos are automatically and permanently deleted within 7 days."}
            </p>
            <p className="flex items-center justify-center gap-1.5 font-medium text-foreground">
              <Lock className="size-3.5 text-primary" />
              {isMarathi
                ? "तुमचा डेटा सुरक्षित आणि खाजगी आहे."
                : "Your data is secure and confidential."}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
          <Button className="h-12 w-full rounded-2xl" disabled={loading} onClick={handleConsent}>
            {loading ? "..." : isMarathi ? "मी संमत आहे" : "I Understand & Consent"}
          </Button>
          <Button variant="ghost" className="w-full text-xs" onClick={() => onOpenChange(false)}>
            {isMarathi ? "रद्द करा" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
