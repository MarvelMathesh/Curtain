'use client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function FilterBar({ filters, onChange, cities }: { filters:any; onChange:(k:string,v:string)=>void; cities:string[] }){
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"/>
        <label htmlFor="search-events" className="sr-only">Search events</label>
        <Input id="search-events" placeholder="Search movies, concerts, venues..." aria-label="Search movies, concerts, venues" className="pl-9 h-10 rounded-full bg-card" value={filters.search} onChange={e=> onChange('search', e.target.value)} />
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col">
          <label htmlFor="filter-type" className="sr-only">Filter by type</label>
          <Select value={filters.type} onValueChange={v=> onChange('type', v)}>
            <SelectTrigger id="filter-type" aria-label="Filter by type" className="w-[160px] rounded-full"><SelectValue placeholder="All types"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="movie">Movies</SelectItem>
              <SelectItem value="concert">Concerts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="filter-city" className="sr-only">Filter by city</label>
          <Select value={filters.city} onValueChange={v=> onChange('city', v)}>
            <SelectTrigger id="filter-city" aria-label="Filter by city" className="w-[160px] rounded-full"><SelectValue placeholder="All cities"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cities.map(c=> <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
