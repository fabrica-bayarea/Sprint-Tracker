import { LoaderCircle } from "lucide-react"

export const Loader = () => {
  return <div className="animate-spin text-red-600 dark:text-red-400"><LoaderCircle size={48} /></div>
}