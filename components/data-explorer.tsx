"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { buttonVariants } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataExplorerProps {
  children: React.ReactNode;
}

export default function DataExplorer({ children }: DataExplorerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-4">
      <div className="flex justify-center">
        <CollapsibleTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-deep-indigo text-faint-star hover:bg-deep-indigo/50 hover:text-starlight",
          )}
        >
          {open ? (
            <ChevronDown size={16} className="mr-2" />
          ) : (
            <ChevronRight size={16} className="mr-2" />
          )}
          {open ? "Hide Data" : "Explore the Data"}
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-6">{children}</CollapsibleContent>
    </Collapsible>
  );
}
