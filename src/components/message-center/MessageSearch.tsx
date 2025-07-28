import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Calendar, User, Tag } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalMessages: number;
  filteredCount: number;
}

const MessageSearch: React.FC<MessageSearchProps> = ({
  searchTerm,
  onSearchChange,
  totalMessages,
  filteredCount,
}) => {
  const [filters, setFilters] = useState({
    type: "",
    sender: "",
    dateRange: "",
  });

  const clearFilters = () => {
    setFilters({ type: "", sender: "", dateRange: "" });
    onSearchChange("");
  };

  const hasActiveFilters =
    searchTerm || filters.type || filters.sender || filters.dateRange;

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages, content, or sender..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => onSearchChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  !
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Messages</h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Message Type</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                    value={filters.type}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, type: e.target.value }))
                    }
                  >
                    <option value="">All Types</option>
                    <option value="user">User Messages</option>
                    <option value="system">System Messages</option>
                    <option value="report">Reports</option>
                    <option value="compliance">Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Sender</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                    value={filters.sender}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        sender: e.target.value,
                      }))
                    }
                  >
                    <option value="">All Senders</option>
                    <option value="system">System</option>
                    <option value="user">Users</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date Range</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: e.target.value,
                      }))
                    }
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button size="sm">Apply Filters</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Search Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          {searchTerm && (
            <span>
              Showing {filteredCount} of {totalMessages} messages
            </span>
          )}
          {!searchTerm && <span>{totalMessages} total messages</span>}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center space-x-2">
            <span className="text-xs">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                <Search className="h-3 w-3 mr-1" />
                Search
              </Badge>
            )}
            {filters.type && (
              <Badge variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {filters.type}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageSearch;
