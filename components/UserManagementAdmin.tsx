import React, { useState, useEffect } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import { User } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';

interface EditableUser extends User {
  isEditing?: boolean;
}

const UserManagementAdmin: React.FC = () => {
  const { users, requests, timeEntries } = useVacationState();
  const dispatch = useVacationDispatch();
  const [editableUsers, setEditableUsers] = useState<EditableUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<EditableUser | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setEditableUsers(users.map(u => ({ ...u, isEditing: false })));
  }, [users]);

  const handleEditUser = (userId: number) => {
    setEditableUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, isEditing: true } : u
    ));
  };

  const handleSaveUser = async (user: EditableUser) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          vacationDays: user.vacationDays,
          paidLeaveDays: user.paidLeaveDays,
        }),
      });

      if (response.ok) {
        setEditableUsers(prev => prev.map(u =>
          u.id === user.id ? { ...u, isEditing: false } : u
        ));
        dispatch({ type: 'SET_USERS', payload: editableUsers.map(u =>
          u.id === user.id ? { ...u, isEditing: false } : u
        ) });
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleCancelEdit = (userId: number) => {
    setEditableUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, isEditing: false } : u
    ));
  };

  const handleInputChange = (userId: number, field: keyof User, value: any) => {
    setEditableUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, [field]: value } : u
    ));
  };

  const getUserHistory = (userName: string) => {
    const userRequests = requests.filter(r => r.employeeName === userName);
    const userTimeEntries = timeEntries.filter(e => e.employeeName === userName);

    return {
      requests: userRequests,
      timeEntries: userTimeEntries,
      totalHours: userTimeEntries.reduce((sum, e) => sum + e.totalWorkingMinutes / 60, 0),
    };
  };

  const userHistory = selectedUser ? getUserHistory(selectedUser.name) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">User Management</h2>
      </div>

      {/* Users List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">All Users</h3>
        <div className="space-y-4">
          {editableUsers.map((user) => (
            <div key={user.email} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              {user.isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={user.firstName || ''}
                        onChange={(e) => handleInputChange(user.id!, 'firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={user.lastName || ''}
                        onChange={(e) => handleInputChange(user.id!, 'lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Vacation Days
                      </label>
                      <input
                        type="number"
                        value={user.vacationDays}
                        onChange={(e) => handleInputChange(user.id!, 'vacationDays', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Paid Leave Days
                      </label>
                      <input
                        type="number"
                        value={user.paidLeaveDays}
                        onChange={(e) => handleInputChange(user.id!, 'paidLeaveDays', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSaveUser(user)} className="bg-green-600 hover:bg-green-700">
                      Save
                    </Button>
                    <Button onClick={() => handleCancelEdit(user.id!)} className="bg-slate-600 hover:bg-slate-700">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Vacation: {user.vacationDays} days | Paid Leave: {user.paidLeaveDays} days
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowHistory(true);
                      }}
                      className="bg-slate-600 hover:bg-slate-700 text-xs"
                    >
                      View History
                    </Button>
                    <Button
                      onClick={() => handleEditUser(user.id!)}
                      className="bg-blue-600 hover:bg-blue-700 text-xs"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* User History Modal */}
      {showHistory && selectedUser && userHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  History: {selectedUser.firstName && selectedUser.lastName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.name}
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {userHistory.requests.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Requests</div>
                </div>
                <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {userHistory.totalHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Hours</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {userHistory.timeEntries.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Work Days</div>
                </div>
              </div>

              {/* Vacation Requests */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Vacation Requests</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userHistory.requests.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">No vacation requests</p>
                  ) : (
                    userHistory.requests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div>
                          <span className="font-medium">{request.type}</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                            {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' :
                          request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Time Entries */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Recent Time Entries</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userHistory.timeEntries.slice(-10).reverse().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <span className="font-medium">{entry.date.toLocaleDateString()}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                          {entry.workType}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {(entry.totalWorkingMinutes / 60).toFixed(1)}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementAdmin;