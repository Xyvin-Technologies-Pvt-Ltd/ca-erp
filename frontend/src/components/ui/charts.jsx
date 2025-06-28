import { Line, Bar, Pie, PieChart as RePieChart, LineChart as ReLineChart, BarChart as ReBarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export function LineChart({ data, categories, colors, height = 400, yAxisWidth = 56 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart
        data={categories.map((category, i) => ({
          name: category,
          ...data.reduce((acc, series) => ({
            ...acc,
            [series.name]: series.data[i]
          }), {})
        }))}
        margin={{
          top: 5,
          right: 10,
          left: 10,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          width={yAxisWidth}
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip />
        <Legend />
        {data.map((series, index) => (
          <Line
            key={series.name}
            type="monotone"
            dataKey={series.name}
            stroke={colors[index]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}

export function BarChart({ data, categories, colors, height = 400, yAxisWidth = 56 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart
        data={categories.map((category, i) => ({
          name: category,
          ...data.reduce((acc, series) => ({
            ...acc,
            [series.name]: series.data[i]
          }), {})
        }))}
        margin={{
          top: 5,
          right: 10,
          left: 10,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          width={yAxisWidth}
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip />
        <Legend />
        {data.map((series, index) => (
          <Bar
            key={series.name}
            dataKey={series.name}
            fill={colors[index]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
}

export function PieChart({ data, colors, height = 400 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RePieChart>
    </ResponsiveContainer>
  );
}