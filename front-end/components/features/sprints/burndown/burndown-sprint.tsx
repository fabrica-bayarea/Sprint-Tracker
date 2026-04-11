import { ChartAreaInteractive } from "./chart-area-interactive"

export const BurndownSprint = () => {
  return (
    <div className="flex flex-col gap-6 px-10 py-4 w-full max-w-full min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Burndown</h1>
          <p className="text-[#5C403C] mt-1 text-sm">Veja as métricas das suas sprints</p>
        </div>
      </div>

      <ChartAreaInteractive />
    </div>
  )
}