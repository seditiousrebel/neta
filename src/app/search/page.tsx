
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Search Netrika</h1>
      <div className="flex w-full max-w-2xl items-center space-x-2">
        <Input type="search" placeholder="Search politicians, parties, bills, promises..." className="flex-grow" />
        <Button type="submit" aria-label="Submit search">
          <SearchIcon className="h-5 w-5 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </div>
      <div className="mt-8 text-center text-muted-foreground">
        <p>Search results will appear here.</p>
        <p className="text-sm">Try searching for "climate change" or "Senator Reed".</p>
      </div>
    </div>
  );
}
