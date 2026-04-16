import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

// Register only when this chunk is loaded
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend,
);

export interface LineChartProps {
  data: any;
  options?: any;
}

export interface DoughnutChartProps {
  data: any;
  options?: any;
}

export function PatientVisitsChart({ data, options }: LineChartProps) {
  const memoData = useMemo(() => data, [data]);
  const memoOptions = useMemo(() => options, [options]);

  return <Line data={memoData} options={memoOptions} />;
}

export function AppointmentStatusChart({ data, options }: DoughnutChartProps) {
  const memoData = useMemo(() => data, [data]);
  const memoOptions = useMemo(() => options, [options]);

  return <Doughnut data={memoData} options={memoOptions} />;
}
