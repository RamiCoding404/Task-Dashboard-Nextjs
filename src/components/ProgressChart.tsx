"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ProgressChartProps {
  progress: number;
  budget: number;
}

export default function ProgressChart({
  progress,
  budget,
}: ProgressChartProps) {
  const progressData = [
    { name: "Completed", value: progress },
    { name: "Remaining", value: Math.max(0, 100 - progress) },
  ];

  const budgetData = [
    { name: "Used", value: Math.round((progress / 100) * budget) },
    { name: "Available", value: Math.round(((100 - progress) / 100) * budget) },
  ];

  const COLORS = ["#3b82f6", "#e5e7eb"];
  const BUDGET_COLORS = ["#ef4444", "#10b981"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-4 bg-card rounded border">
      <div>
        <h3 className="text-lg font-semibold mb-4">Project Progress</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={progressData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {progressData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{progress}%</p>
          <p className="text-sm text-gray-600">Progress</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Budget Utilization</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={budgetData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {budgetData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BUDGET_COLORS[index % BUDGET_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            ${Math.round((progress / 100) * budget).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Used / ${budget.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
