import { BookOpenCheck } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DOMAINS } from "@/lib/topics";
import { cn } from "@/lib/utils";

type Props = {
  currentTopic: string;
  onSelect: (topic: string, domain: string) => void;
  disabled?: boolean;
};

/** Expandable AZ-900 domains with exam weightings and clickable sub-topics. */
export function TopicNav({ currentTopic, onSelect, disabled }: Props) {
  return (
    <nav aria-label="AZ-900 topics" className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <BookOpenCheck className="size-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold">Skills outline</h2>
      </div>
      <Accordion
        type="multiple"
        defaultValue={[DOMAINS[0]?.id ?? ""]}
        className="flex flex-col gap-2"
      >
        {DOMAINS.map((domain, i) => (
          <AccordionItem
            key={domain.id}
            value={domain.id}
            className="rounded-xl border border-border bg-card px-3 shadow-soft"
          >
            <AccordionTrigger className="gap-2 py-3 text-left hover:no-underline">
              <span className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Domain {i + 1}
                </span>
                <span className="text-sm font-semibold leading-snug">{domain.title}</span>
                <span className="w-fit rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-amber-foreground dark:text-amber">
                  {domain.weight} of exam
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="flex flex-col gap-3">
                {domain.groups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.title}
                    </p>
                    <ul className="flex flex-col">
                      {group.items.map((item) => {
                        const active = item === currentTopic;
                        return (
                          <li key={item}>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => onSelect(item, domain.title)}
                              aria-current={active ? "true" : undefined}
                              className={cn(
                                "w-full rounded-lg px-2 py-2 text-left text-sm transition-colors disabled:opacity-50",
                                "hover:bg-teal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                active && "bg-secondary font-semibold text-secondary-foreground",
                              )}
                            >
                              {item}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </nav>
  );
}
