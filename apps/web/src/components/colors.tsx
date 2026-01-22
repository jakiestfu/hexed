import { FunctionComponent } from "react"

const colors = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"]

export const Colors: FunctionComponent = () => {
  return new Array(5).fill(0).map((_, index) => {
    return (
      <div
        key={`chart-color-${index}`}
        className="size-20 flex items-center justify-center rounded-md"
        style={{ backgroundColor: `var(${colors[index]})` }}
      >
        <span className="text-sm text-white">
          {colors[index].replace("--", "")}
        </span>
      </div>
    )
  })
}
