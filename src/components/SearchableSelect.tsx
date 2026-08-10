import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableOption = { id: string; nome: string };

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  emptyLabel,
  onSearch,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SearchableOption[];
  placeholder: string;
  emptyLabel: string;
  /** Quando informado, a busca é feita no servidor (debounce ~250ms) em vez de filtrar localmente. */
  onSearch?: (query: string) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const serverSearch = typeof onSearch === "function";

  useEffect(() => {
    if (!serverSearch || !open) return;
    const t = setTimeout(() => onSearch!(query.trim()), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open, serverSearch]);

  const selected = options.find((o) => o.id === value);
  const label = value === "none" || !value ? emptyLabel : selected?.nome ?? emptyLabel;
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", (value === "none" || !value) && "text-muted-foreground")}>{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={!serverSearch}>
          <CommandInput
            placeholder={placeholder}
            value={serverSearch ? query : undefined}
            onValueChange={serverSearch ? setQuery : undefined}
          />
          <CommandList>
            <CommandEmpty>{loading ? "Buscando..." : "Nenhum resultado."}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={emptyLabel}
                onSelect={() => { onChange("none"); setOpen(false); }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === "none" ? "opacity-100" : "opacity-0")} />
                {emptyLabel}
              </CommandItem>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={serverSearch ? o.id : o.nome}
                  onSelect={() => { onChange(o.id); setOpen(false); setQuery(""); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === o.id ? "opacity-100" : "opacity-0")} />
                  {o.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SearchableSelect;
