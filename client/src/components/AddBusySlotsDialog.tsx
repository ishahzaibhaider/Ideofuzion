import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { authenticatedApiRequest } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AddBusySlotsDialog() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const { toast } = useToast();

  // Generate time options in 15-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 1; hour <= 12; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour}:${minute.toString().padStart(2, '0')}`;
        options.push(`${timeStr} AM`);
        options.push(`${timeStr} PM`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const createSlotMutation = useMutation({
    mutationFn: async (slotData: { date: string; startTime: string; endTime: string; reason: string }) => {
      const response = await authenticatedApiRequest("POST", "/api/busy-slots", slotData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/busy-slots"] });
      toast({
        title: "Success",
        description: "Time slot marked as busy",
      });
      // Reset form after successful save
      setSelectedDate(undefined);
      setStartTime("");
      setEndTime("");
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add busy slot",
        variant: "destructive",
      });
    },
  });

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

  const handleSave = async () => {
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    if (!startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please select both start and end time",
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

      await createSlotMutation.mutateAsync({
        date: dateStr,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        reason: "Busy",
      });
    } catch (error) {
      console.error("Error saving slot:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-orange-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Add Busy Slots</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Mark Time as Busy</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Choose a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {selectedDate && startTime && endTime && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="text-sm font-medium text-orange-900 mb-2">Preview</h4>
              <p className="text-sm text-orange-700">
                <strong>{format(selectedDate, "EEEE, MMMM d, yyyy")}</strong> from{" "}
                <strong>{startTime}</strong> to <strong>{endTime}</strong> will be marked as busy.
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createSlotMutation.isPending || !selectedDate || !startTime || !endTime}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {createSlotMutation.isPending ? "Saving..." : "Mark as Busy"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}