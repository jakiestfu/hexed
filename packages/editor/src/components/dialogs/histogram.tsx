import { useMemo, useState, type FunctionComponent } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { byteToHex } from "@hexed/binary-utils/formatter"
import {
  Badge,
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch
} from "@hexed/ui"
import { cn } from "@hexed/ui/lib/utils"

export type HistogramProps = {
  data: Uint8Array
}

/**
 * Calculates byte frequency distribution for binary data
 */
function calculateByteFrequencies(
  data: Uint8Array,
  rangeStart: number = 0,
  rangeEnd: number = data.length - 1
): Array<{
  byte: number
  count: number
  hex: string
}> {
  const frequencies = new Array(256).fill(0)

  // Count occurrences of each byte value within the range
  const start = Math.max(0, rangeStart)
  const end = Math.min(data.length - 1, rangeEnd)

  for (let i = start; i <= end; i++) {
    frequencies[data[i]]++
  }

  // Convert to array format for chart
  return frequencies.map((count, byte) => ({
    byte,
    count,
    hex: byteToHex(byte)
  }))
}

/**
 * Generate all 256 hex byte values (0x00-0xFF)
 */
function generateHexOptions(): Array<{ value: number; label: string }> {
  return Array.from({ length: 256 }, (_, i) => ({
    value: i,
    label: `0x${byteToHex(i)}`
  }))
}

export const Histogram: FunctionComponent<HistogramProps> = ({ data }) => {
  // State management
  const [selectedBytes, setSelectedBytes] = useState<number[]>([])
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(true)
  const [rangeStart, setRangeStart] = useState<number>(0)
  const [rangeEnd, setRangeEnd] = useState<number>(data.length - 1)
  const [hexComboboxOpen, setHexComboboxOpen] = useState(false)
  const [hexSearchValue, setHexSearchValue] = useState("")

  // Generate hex options
  const hexOptions = useMemo(() => generateHexOptions(), [])

  // Convert selectedBytes array to Set for O(1) lookups
  const selectedBytesSet = useMemo(
    () => new Set(selectedBytes),
    [selectedBytes]
  )

  // Calculate filtered chart data
  const chartData = useMemo(() => {
    let frequencies = calculateByteFrequencies(data, rangeStart, rangeEnd)

    // Apply hex filter if bytes are selected
    if (selectedBytes.length > 0) {
      if (showOnlySelected) {
        // Show only selected bytes - use Set for O(1) lookup
        frequencies = frequencies.filter((item) =>
          selectedBytesSet.has(item.byte)
        )
      } else {
        // Hide selected bytes - use Set for O(1) lookup
        frequencies = frequencies.filter(
          (item) => !selectedBytesSet.has(item.byte)
        )
      }
    }

    return frequencies
  }, [
    data,
    rangeStart,
    rangeEnd,
    selectedBytes,
    selectedBytesSet,
    showOnlySelected
  ])

  const chartConfig = {
    count: {
      label: "Frequency",
      color: "hsl(var(--primary))"
    }
  }

  // Handle hex byte selection
  const handleHexSelect = (byteValue: number) => {
    setSelectedBytes((prev) =>
      prev.includes(byteValue)
        ? prev.filter((b) => b !== byteValue)
        : [...prev, byteValue]
    )
    setHexSearchValue("")
  }

  // Handle range validation
  const handleRangeStartChange = (value: number) => {
    const numValue = Math.max(0, Math.min(value, data.length - 1))
    setRangeStart(numValue)
    if (numValue > rangeEnd) {
      setRangeEnd(numValue)
    }
  }

  const handleRangeEndChange = (value: number) => {
    const numValue = Math.max(0, Math.min(value, data.length - 1))
    setRangeEnd(numValue)
    if (numValue < rangeStart) {
      setRangeStart(numValue)
    }
  }

  // Filter hex options by search
  const filteredHexOptions = useMemo(() => {
    if (!hexSearchValue) return hexOptions
    const searchLower = hexSearchValue.toLowerCase()
    return hexOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.value.toString().includes(searchLower)
    )
  }, [hexOptions, hexSearchValue])

  const maxValue = data.length - 1

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar Section */}
      <div className="border-b p-2 bg-sidebar">
        <div className="flex flex-wrap items-center gap-2">
          {/* Hex Filter */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Popover
              open={hexComboboxOpen}
              onOpenChange={setHexComboboxOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  role="combobox"
                  aria-expanded={hexComboboxOpen}
                  className="justify-between min-w-[200px]"
                >
                  {selectedBytes.length > 0
                    ? `${selectedBytes.length} byte(s)`
                    : "Filter hex values..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[300px] p-0"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search hex values..."
                    value={hexSearchValue}
                    onValueChange={setHexSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>No hex value found.</CommandEmpty>
                    <CommandGroup>
                      {filteredHexOptions.map((option) => {
                        const isSelected = selectedBytesSet.has(option.value)
                        return (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => handleHexSelect(option.value)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label} ({option.value})
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedBytes.length > 0 && (
              <>
                <div className="flex flex-wrap gap-1">
                  {selectedBytes.map((byte) => (
                    <Badge
                      key={byte}
                      variant="secondary"
                      className="gap-1 text-xs"
                    >
                      {`0x${byteToHex(byte)}`}
                      <button
                        onClick={() => handleHexSelect(byte)}
                        className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="filter-mode"
                    checked={showOnlySelected}
                    onCheckedChange={setShowOnlySelected}
                  />
                  <Label
                    htmlFor="filter-mode"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    {showOnlySelected ? "Show only" : "Hide"}
                  </Label>
                </div>
              </>
            )}
          </div>

          {/* Range Inputs */}
          <div className="flex items-center gap-2 mr-10">
            <InputGroup className="w-auto">
              <InputGroupAddon>
                <InputGroupText className="text-xs">Start:</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                min={0}
                max={maxValue}
                value={rangeStart}
                onChange={(e) => handleRangeStartChange(Number(e.target.value))}
                className="w-24"
              />
            </InputGroup>
            <InputGroup className="w-auto">
              <InputGroupAddon>
                <InputGroupText className="text-xs">End:</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                min={0}
                max={maxValue}
                value={rangeEnd}
                onChange={(e) => handleRangeEndChange(Number(e.target.value))}
                className="w-24"
              />
            </InputGroup>
            <span className="text-xs text-muted-foreground">
              Max: {maxValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <ChartContainer
        config={chartConfig}
        className="h-[80vh] w-full overflow-auto"
      >
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="hex"
            tick={{ fontSize: 9 }}
            interval={7}
            angle={-45}
            textAnchor="end"
            height={64}
            label={{
              value: "Byte Value (Hex)",
              position: "insideBottom"
            }}
          />
          <YAxis
            label={{ value: "Frequency", angle: -90, position: "insideLeft" }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [
                  `${value?.toLocaleString()} occurrences`,
                  "Frequency"
                ]}
                labelFormatter={(label, payload) => {
                  if (!payload || payload.length === 0) return ""
                  const item = payload[0]
                  return `Byte 0x${item.payload.hex} (${item.payload.byte})`
                }}
              />
            }
          />
          <Bar
            dataKey="count"
            fill="var(--primary)"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
