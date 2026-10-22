import { useMemo, useState } from "react";
import { BookA, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GLOSSARY } from "@/lib/glossary";

type Props = { onPick: (term: string) => void };

/** Searchable mini glossary. Picking a term asks the tutor to explain it. */
export function GlossarySheet({ onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(
      (g) => g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Open glossary">
          <BookA aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">Mini glossary</SheetTitle>
          <SheetDescription>Tap a term to get a full explanation in the chat.</SheetDescription>
        </SheetHeader>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms…"
            aria-label="Search glossary"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <ul className="-mx-2 flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-6">
          {results.length === 0 && (
            <li className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              No terms match “{query}”. Try asking the Study Buddy directly.
            </li>
          )}
          {results.map((g) => (
            <li key={g.term}>
              <button
                type="button"
                onClick={() => {
                  onPick(g.term);
                  setOpen(false);
                }}
                className="w-full rounded-xl p-3 text-left transition-colors hover:bg-teal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block text-sm font-semibold text-primary">{g.term}</span>
                <span className="block text-sm text-muted-foreground">{g.definition}</span>
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
