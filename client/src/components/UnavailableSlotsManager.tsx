import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon, Edit, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnavailableSlot } from "@shared/schema";

interface EditSlotDialogProps {
  slot: UnavailableSlot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditSlotDialog({ slot, open, onOpenChange }: EditSlotDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(slot.date));
  const [startTime, setStartTime] = useState<string>(() => {
    // Extract time from datetime string and convert to 12-hour format
    const datetime = new Date(slot.startTime);
    return datetime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  });
  const [endTime, setEndTime] = useState<string>(() => {
    // Extract time from datetime string and convert to 12-hour format
    const datetime = new Date(slot.endTime);
    return datetime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  });
  const [reason, setReason] = useState<string>(slot.reason || "Unavailable");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    let hour = parseInt(hours, 10);
    
    if (modifier === 'AM') {
      if (hour === 12) {
        hour = 0; // 12:00 AM becomes 00:00
      }
    } else if (modifier === 'PM') {
      if (hour !== 12) {
        hour += 12; // 1:00 PM becomes 13:00, but 12:00 PM stays 12:00
      }
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const updateSlotMutation = useMutation({
    mutationFn: async (data: { date: string; startTime: string; endTime: string; reason: string }) => {
      const response = await authenticatedApiRequest("PUT", `/api/unavailable-slots/${slot.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unavailable-slots"] });
      toast({
        title: "Success",
        description: "Unavailable slot updated successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update unavailable slot",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    if (!selectedDate || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format the local date as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Convert 12-hour format to 24-hour format
      const startTime24 = convertTo24Hour(startTime);
      const endTime24 = convertTo24Hour(endTime);
      
      // Create local Date objects for start and end times
      const startDate = new Date(`${dateStr}T${startTime24}:00`);
      const endDate = new Date(`${dateStr}T${endTime24}:00`);
      
      // Convert to UTC ISO strings using .toISOString()
      const startTimeUTC = startDate.toISOString();
      const endTimeUTC = endDate.toISOString();

      await updateSlotMutation.mutateAsync({
        date: dateStr,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        reason,
      });
    } catch (error) {
      console.error("Error updating slot:", error);
    }
  };

  // Generate time options for dropdown
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const date = new Date(`2000-01-01T${time24}:00`);
        const time12 = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        options.push(time12);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Unavailable Slot</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slots */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for unavailability"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateSlotMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {updateSlotMutation.isPending ? "Updating..." : "Update Slot"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function UnavailableSlotsManager() {
  const [editingSlot, setEditingSlot] = useState<UnavailableSlot | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["/api/unavailable-slots"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/unavailable-slots");
      return response.json();
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const response = await authenticatedApiRequest("DELETE", `/api/unavailable-slots/${slotId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unavailable-slots"] });
      toast({
        title: "Success",
        description: "Unavailable slot deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete unavailable slot",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (slotId: string) => {
    if (confirm("Are you sure you want to delete this unavailable slot?")) {
      await deleteSlotMutation.mutateAsync(slotId);
    }
  };

  const formatDisplayTime = (datetime: string) => {
    try {
      const date = new Date(datetime);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return datetime;
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "PPP");
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Unavailable Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Unavailable Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No unavailable slots configured</p>
              <p className="text-sm">Use the "Add Unavailable Slots" button to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot: UnavailableSlot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDisplayDate(slot.date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDisplayTime(slot.startTime)} - {formatDisplayTime(slot.endTime)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {slot.reason}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSlot(slot)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slot.id)}
                      disabled={deleteSlotMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingSlot && (
        <EditSlotDialog
          slot={editingSlot}
          open={!!editingSlot}
          onOpenChange={(open) => !open && setEditingSlot(null)}
        />
      )}
    </>
  );
}