import { useEffect, useState } from "react";
import { Toast } from "../_components/shared/Toast";

export default function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { if (!msg) return; const t = setTimeout(()=>setMsg(null), 3000); return ()=>clearTimeout(t); }, [msg]);
  return { setMsg, ToastEl: msg ? <Toast message={msg} /> : null } as const;
}
