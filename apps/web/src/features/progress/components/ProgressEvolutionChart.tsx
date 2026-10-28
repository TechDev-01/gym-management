import { MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../../components/feedback/States'
import { formatDate } from '../../../utils/format'
import { progressMetrics, type ProgressMetricKey, type ProgressRecord } from '../types'

interface ProgressEvolutionChartProps {
  records: ProgressRecord[]
}

const width = 720
const height = 260
const padding = { top: 24, right: 24, bottom: 36, left: 52 }

function formatValue(value: number, unit: string): string {
  return `${value.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${unit}`
}

export function ProgressEvolutionChart({ records }: ProgressEvolutionChartProps) {
  const [metricKey, setMetricKey] = useState<ProgressMetricKey>('weightKg')
  const metric = progressMetrics.find((item) => item.key === metricKey) ?? progressMetrics[0]

  const points = useMemo(
    () =>
      records
        .filter((record) => record[metric.key] !== null)
        .map((record) => ({
          date: record.measuredAt,
          value: record[metric.key] as number,
        }))
        .sort((left, right) => left.date.localeCompare(right.date)),
    [metric.key, records],
  )

  if (points.length === 0) {
    return (
      <Stack spacing={2}>
        <MetricSelect value={metricKey} onChange={setMetricKey} />
        <EmptyState message={`No hay mediciones de ${metric.label.toLowerCase()} para graficar.`} />
      </Stack>
    )
  }

  const values = points.map((point) => point.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const range = rawMax - rawMin
  const paddingValue = range === 0 ? Math.max(1, rawMax * 0.1) : range * 0.15
  const min = rawMin - paddingValue
  const max = rawMax + paddingValue
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const xFor = (index: number): number =>
    points.length === 1
      ? padding.left + chartWidth / 2
      : padding.left + (index / (points.length - 1)) * chartWidth
  const yFor = (value: number): number =>
    padding.top + ((max - value) / (max - min)) * chartHeight

  const line = points.map((point, index) => `${xFor(index)},${yFor(point.value)}`).join(' ')
  const ticks = [max, max - (max - min) / 2, min]

  return (
    <Stack spacing={2}>
      <MetricSelect value={metricKey} onChange={setMetricKey} />
      <Stack sx={{ overflowX: 'auto' }}>
        <svg
          role="img"
          aria-label={`Evolución de ${metric.label}`}
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          style={{ minWidth: 520, maxWidth: width }}
        >
          {ticks.map((tick) => {
            const y = yFor(tick)
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#252e42"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#aab3c4"
                  fontSize="11"
                >
                  {tick.toLocaleString('es-MX', { maximumFractionDigits: 1 })}
                </text>
              </g>
            )
          })}
          <polyline
            fill="none"
            stroke={metric.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={line}
          />
          {points.map((point, index) => (
            <circle
              key={`${point.date}-${index}`}
              cx={xFor(index)}
              cy={yFor(point.value)}
              r="4"
              fill={metric.color}
            >
              <title>
                {formatDate(point.date)}: {formatValue(point.value, metric.unit)}
              </title>
            </circle>
          ))}
          {points.map((point, index) => {
            const showLabel =
              index === 0 || index === points.length - 1 || points.length <= 4

            return showLabel ? (
              <text
                key={`label-${point.date}-${index}`}
                x={xFor(index)}
                y={height - 12}
                textAnchor="middle"
                fill="#aab3c4"
                fontSize="11"
              >
                {formatDate(point.date)}
              </text>
            ) : null
          })}
          <text
            x={12}
            y={padding.top + chartHeight / 2}
            transform={`rotate(-90 12 ${padding.top + chartHeight / 2})`}
            textAnchor="middle"
            fill="#aab3c4"
            fontSize="11"
          >
            {metric.unit}
          </text>
        </svg>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {points.length} {points.length === 1 ? 'medición' : 'mediciones'} de{' '}
        {metric.label.toLowerCase()}. Pasa el cursor sobre cada punto para ver el valor.
      </Typography>
    </Stack>
  )
}

function MetricSelect({
  value,
  onChange,
}: {
  value: ProgressMetricKey
  onChange: (value: ProgressMetricKey) => void
}) {
  return (
    <TextField
      select
      size="small"
      label="Métrica"
      value={value}
      onChange={(event) => onChange(event.target.value as ProgressMetricKey)}
      sx={{ maxWidth: 240 }}
    >
      {progressMetrics.map((metric) => (
        <MenuItem key={metric.key} value={metric.key}>
          {metric.label}
        </MenuItem>
      ))}
    </TextField>
  )
}
