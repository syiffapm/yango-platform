import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
export const PALETTE = ['#38663b', '#6a9d6c', '#0284c7', '#d97706', '#7c3aed', '#64748b', '#be123c', '#0f766e']
const axis = { tick: { fontSize: 10.5, fill: '#8a93a1' }, tickLine: false, axisLine: false }
const tip = {
  contentStyle: {
    fontSize: 11.5,
    borderRadius: 8,
    border: '1px solid #d7dbe0',
    boxShadow: '0 6px 16px rgba(16,24,40,.08)',
    padding: '6px 10px',
  },
  labelStyle: { fontWeight: 600, marginBottom: 2 },
}
export function TrendChart({ data, x = 'date', series, height = 200, stacked, format }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color || PALETTE[i]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={s.color || PALETTE[i]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" vertical={false} />
        <XAxis dataKey={x} {...axis} />
        <YAxis {...axis} tickFormatter={format} width={52} />
        <Tooltip {...tip} formatter={format ? (v) => format(v) : undefined} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />}
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color || PALETTE[i]}
            strokeWidth={2}
            fill={`url(#g-${s.key})`}
            stackId={stacked ? '1' : undefined}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
export function BarsChart({ data, x, series, height = 200, layout = 'horizontal', format }) {
  const vertical = layout === 'vertical'
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={vertical ? 'vertical' : 'horizontal'}
        margin={{ top: 6, right: 10, left: vertical ? 10 : -18, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" vertical={vertical} horizontal={!vertical} />
        {vertical ? <XAxis type="number" {...axis} tickFormatter={format} /> : <XAxis dataKey={x} {...axis} />}
        {vertical ? (
          <YAxis type="category" dataKey={x} {...axis} width={110} />
        ) : (
          <YAxis {...axis} tickFormatter={format} width={52} />
        )}
        <Tooltip {...tip} formatter={format ? (v) => format(v) : undefined} cursor={{ fill: '#f6f7f8' }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color || PALETTE[i]}
            radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            maxBarSize={vertical ? 16 : 34}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
export function LinesChart({ data, x, series, height = 200, format }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" vertical={false} />
        <XAxis dataKey={x} {...axis} />
        <YAxis {...axis} tickFormatter={format} width={48} />
        <Tooltip {...tip} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color || PALETTE[i]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
export function DonutChart({ data, height = 190, format, center }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="60%"
            outerRadius="86%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={d.color || PALETTE[i]} />
            ))}
          </Pie>
          <Tooltip {...tip} formatter={format ? (v) => format(v) : undefined} />
        </PieChart>
      </ResponsiveContainer>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[19px] font-semibold text-ink-900 leading-none">{center.value}</span>
          <span className="text-[11.5px] text-ink-500 mt-1">{center.label}</span>
        </div>
      )}
    </div>
  )
}
export function Legend2({ items }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
      {items.map((it, i) => (
        <span key={it.name} className="inline-flex items-center gap-1.5 text-[12px] text-ink-600">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: it.color || PALETTE[i] }} />
          {it.name}
        </span>
      ))}
    </div>
  )
}
