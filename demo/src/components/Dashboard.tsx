import { useEffect, useState } from 'react';
import { useAgentActions } from '@agent-action-registry/react';
import type { Action } from '@agent-action-registry/react';
import './Dashboard.css';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
}

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: 'pending' | 'approved' | 'shipped';
}

function Dashboard() {
  const { registerAction } = useAgentActions();
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Review Q4 report', status: 'todo' },
    { id: '2', title: 'Update billing system', status: 'in-progress' },
    { id: '3', title: 'Customer onboarding', status: 'done' }
  ]);

  const [orders, setOrders] = useState<Order[]>([
    { id: '001', customer: 'Acme Corp', amount: 15000, status: 'pending' },
    { id: '002', customer: 'TechStart Inc', amount: 8500, status: 'approved' },
    { id: '003', customer: 'Global Industries', amount: 22000, status: 'pending' },
    { id: '004', customer: 'Innovation Labs', amount: 12500, status: 'shipped' }
  ]);

  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    const createTaskAction: Action = {
      id: 'create_task',
      name: 'Create Task',
      description: 'Creates a new task in the dashboard',
      inputs: {
        title: {
          type: 'string',
          required: true,
          description: 'The title of the task'
        },
        status: {
          type: 'enum',
          enum: ['todo', 'in-progress', 'done'],
          required: false,
          description: 'Initial status of the task'
        }
      },
      permissions: ['tasks:write'],
      handler: async (input: any) => {
        const newTask: Task = {
          id: String(Date.now()),
          title: input.title,
          status: input.status || 'todo'
        };
        setTasks(prev => [...prev, newTask]);
        return { success: true, task: newTask };
      }
    };

    const filterOrdersAction: Action = {
      id: 'filter_orders',
      name: 'Filter Orders',
      description: 'Filters orders by status',
      inputs: {
        status: {
          type: 'enum',
          enum: ['pending', 'approved', 'shipped', 'all'],
          required: true,
          description: 'Status to filter by'
        }
      },
      permissions: ['orders:read'],
      handler: async (input: any) => {
        const status = input.status === 'all' ? null : input.status;
        setFilterStatus(status);
        const filtered = status
          ? orders.filter(o => o.status === status)
          : orders;
        return { success: true, count: filtered.length, orders: filtered };
      }
    };

    const exportCsvAction: Action = {
      id: 'export_csv',
      name: 'Export CSV',
      description: 'Exports filtered orders to CSV format',
      inputs: {},
      permissions: ['orders:export'],
      handler: async () => {
        const filtered = filterStatus
          ? orders.filter(o => o.status === filterStatus)
          : orders;

        const csv = [
          'Order ID,Customer,Amount,Status',
          ...filtered.map(o => `${o.id},${o.customer},${o.amount},${o.status}`)
        ].join('\n');

        return {
          success: true,
          rowCount: filtered.length,
          csv,
          message: `Exported ${filtered.length} orders`
        };
      }
    };

    const approvePurchaseAction: Action = {
      id: 'approve_purchase_order',
      name: 'Approve Purchase Order',
      description: 'Approves a pending purchase order',
      inputs: {
        orderId: {
          type: 'string',
          required: true,
          description: 'The ID of the order to approve'
        }
      },
      permissions: ['billing:write'],
      handler: async (input: any) => {
        const order = orders.find(o => o.id === input.orderId);

        if (!order) {
          throw new Error(`Order ${input.orderId} not found`);
        }

        if (order.status !== 'pending') {
          throw new Error(`Order ${input.orderId} is not pending (current status: ${order.status})`);
        }

        setOrders(prev => prev.map(o =>
          o.id === input.orderId
            ? { ...o, status: 'approved' as const }
            : o
        ));

        return {
          success: true,
          orderId: input.orderId,
          message: `Order ${input.orderId} approved`
        };
      }
    };

    registerAction(createTaskAction);
    registerAction(filterOrdersAction);
    registerAction(exportCsvAction);
    registerAction(approvePurchaseAction);
  }, [registerAction, orders, filterStatus]);

  const filteredOrders = filterStatus
    ? orders.filter(o => o.status === filterStatus)
    : orders;

  return (
    <div className="dashboard">
      <div className="dashboard-section">
        <h2>Tasks</h2>
        <div className="card-list">
          {tasks.map(task => (
            <div key={task.id} className="card">
              <div className="card-title">{task.title}</div>
              <div className={`status-badge status-${task.status}`}>
                {task.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Orders</h2>
          {filterStatus && (
            <span className="filter-badge">
              Filtered: {filterStatus}
            </span>
          )}
        </div>
        <div className="card-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="card">
              <div className="card-title">{order.customer}</div>
              <div className="card-meta">
                <span className="order-id">#{order.id}</span>
                <span className="order-amount">${order.amount.toLocaleString()}</span>
              </div>
              <div className={`status-badge status-${order.status}`}>
                {order.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
