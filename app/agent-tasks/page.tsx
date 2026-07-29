'use client';

import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import DashboardLayout from '@/components/layout/DashboardLayout';

type AgentTaskStatus = 'Queued' | 'Running' | 'Completed' | 'Needs review';

type AgentTask = {
  id: string;
  task: string;
  type: string;
  status: AgentTaskStatus;
  progress: number;
  model: string;
  createdAt: string;
  updatedAt: string;
};

const demoTasks: AgentTask[] = [
  {
    id: 'task-001',
    task: 'Summarise supplier concentration',
    type: 'Analysis',
    status: 'Completed',
    progress: 100,
    model: 'Rule-based',
    createdAt: '2026-07-29 09:10',
    updatedAt: '2026-07-29 09:12',
  },
  {
    id: 'task-002',
    task: 'Prepare weekly company report',
    type: 'Report',
    status: 'Running',
    progress: 65,
    model: 'Mock',
    createdAt: '2026-07-29 09:18',
    updatedAt: '2026-07-29 09:20',
  },
  {
    id: 'task-003',
    task: 'Review uploaded supplier file',
    type: 'File analysis',
    status: 'Needs review',
    progress: 80,
    model: 'Qwen 3.5',
    createdAt: '2026-07-29 09:24',
    updatedAt: '2026-07-29 09:25',
  },
  {
    id: 'task-004',
    task: 'Refresh network snapshot',
    type: 'Data refresh',
    status: 'Queued',
    progress: 0,
    model: 'Rule-based',
    createdAt: '2026-07-29 09:30',
    updatedAt: '2026-07-29 09:30',
  },
];

function statusColor(
  status: AgentTaskStatus,
): 'default' | 'info' | 'success' | 'warning' {
  if (status === 'Completed') {
    return 'success';
  }

  if (status === 'Running') {
    return 'info';
  }

  if (status === 'Needs review') {
    return 'warning';
  }

  return 'default';
}

export default function AgentTasksPage() {
  return (
    <DashboardLayout>
      <Box sx={{ width: '100%', maxWidth: 1500, mx: 'auto' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Agent Tasks
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
          A preview of AI Agent work items. Task orchestration will be added in a
          later milestone.
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ minWidth: 180 }}>Progress</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Created at</TableCell>
                <TableCell>Updated at</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {demoTasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {task.task}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.id}
                    </Typography>
                  </TableCell>
                  <TableCell>{task.type}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      size="small"
                      color={statusColor(task.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={task.progress}
                        sx={{ flex: 1, height: 7, borderRadius: 4 }}
                      />
                      <Typography variant="caption" sx={{ minWidth: 34 }}>
                        {task.progress}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{task.model}</TableCell>
                  <TableCell>{task.createdAt}</TableCell>
                  <TableCell>{task.updatedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </DashboardLayout>
  );
}
