import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, FileIcon, Hash, LockIcon } from "lucide-react";
import Link from "next/link";

interface SlicerProps {
  id: string;
  fileName: string;
  pdf_password: string | null;
  created_at?: string;
  updated_at?: string;
  description?: string;
  total_pdfs?: number;
}

export function Slicer({
  id,
  fileName,
  pdf_password,
  created_at,
  updated_at,
  description,
  total_pdfs = 0
}: SlicerProps) {
  return (
    <Link href={`/studio/slicers/${id}`} className="block w-full">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-full"
      >
        <Card className="relative bg-gradient-to-b from-background/50 to-background border-border/40 hover:border-border/80 hover:shadow-lg transition-all duration-300 ease-in-out overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 flex items-center space-x-2">
            {pdf_password && (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <LockIcon className="h-3 w-3 mr-1 opacity-70" />
                Protected
              </Badge>
            )}
          </div>
          <CardHeader className="relative p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 bg-primary/5 rounded-xl group-hover:bg-primary/10 transition-colors">
                <FileIcon className="h-5 w-5 text-primary/70" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-medium text-foreground/90 truncate">
                  {fileName}
                </CardTitle>
                {description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {description}
                  </p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
            </div>
            <CardContent className="p-0 pt-3 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1.5">
                  <Hash className="h-3.5 w-3.5 opacity-70" />
                  <span>{total_pdfs} PDFs</span>
                </div>
                {created_at && (
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                    <span>{format(new Date(created_at), "MMM d, yyyy")}</span>
                  </div>
                )}
                {updated_at && (
                  <div className="flex items-center space-x-1.5 col-span-2">
                    <Clock className="h-3.5 w-3.5 opacity-70" />
                    <span>Updated {format(new Date(updated_at), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </CardHeader>
        </Card>
      </motion.div>
    </Link>
  );
}