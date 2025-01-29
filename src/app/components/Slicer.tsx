import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, Hash, LockIcon, Scissors } from "lucide-react";
import Link from "next/link";

interface SlicerProps {
  id: string;
  fileName: string;
  pdf_password: string | null;
  created_at?: string;
  updated_at?: string;
  description?: string;
  total_pdfs?: number;
  isSeeded?: boolean;
}

export function Slicer({
  id,
  fileName,
  pdf_password,
  created_at,
  updated_at,
  description,
  total_pdfs = 0,
  isSeeded = false
}: SlicerProps) {
  return (
    <Link href={`/studio/slicers/${id}`} className="block w-full">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-full"
      >
        <Card className="relative bg-gradient-to-b from-background/50 to-background border-border/40 hover:border-border/80 hover:shadow-lg transition-all duration-300 ease-in-out overflow-hidden group h-[200px] flex flex-col">
          <div className="absolute top-0 right-0 p-3 flex items-center space-x-2 z-10">
            {pdf_password && (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <LockIcon className="h-3 w-3 mr-1 opacity-70" />
                Protected
              </Badge>
            )}
          </div>
          <CardHeader className="relative p-4 flex-1">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-primary/5 rounded-xl group-hover:bg-primary/10 transition-colors flex-shrink-0">
                <Scissors className="h-5 w-5 text-primary/70" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isSeeded && (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground mb-1 block w-fit">
                        Demo
                      </Badge>
                    )}
                    <CardTitle className="text-base font-medium text-foreground/90 truncate pr-6 capitalize">
                      {fileName}
                    </CardTitle>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary/70 transition-colors flex-shrink-0 mt-1" />
                </div>
                {description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-3 border-t border-border/50 mt-auto">
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
        </Card>
      </motion.div>
    </Link>
  );
}