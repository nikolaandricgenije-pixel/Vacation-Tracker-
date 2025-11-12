import React, { useState, useMemo } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import { VacationRequest, VacationStatus, LeaveType } from '../types';
import { format, areIntervalsOverlapping } from 'date-fns';
import Button from './ui/Button';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';

const StatusBadge: React.FC<{ status: VacationStatus }> = ({ status }) => {
   const statusStyles = {
     [VacationStatus.Pending]: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
     [VacationStatus.PendingPMAproval]: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
     [VacationStatus.PendingAdminApproval]: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300',
     [VacationStatus.Approved]: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
     [VacationStatus.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
   };
   return (
     <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
       {status}
     </span>
   );
 };

const VacationItem: React.FC<{ request: VacationRequest; allRequests: VacationRequest[]; isAdmin: boolean; currentUserName: string; currentUserRoles: string[]; }> = ({ request, allRequests, isAdmin, currentUserName, currentUserRoles }) => {
  const dispatch = useVacationDispatch();

  const overlappingRequests = useMemo(() => {
    if (!isAdmin || request.status !== VacationStatus.Pending) return [];

    return allRequests.filter(otherReq =>
      otherReq.id !== request.id &&
      otherReq.status === VacationStatus.Approved &&
      areIntervalsOverlapping(
        { start: request.startDate, end: request.endDate },
        { start: otherReq.startDate, end: otherReq.endDate }
      )
    );
  }, [request, allRequests, isAdmin]);

  const handleApprove = () => {
    let newStatus = VacationStatus.Approved;
    let notificationMessage = `Request for ${request.employeeName} approved.`;

    // Handle multi-level approval
    if (request.type === LeaveType.Vacation && request.status === VacationStatus.PendingPMAproval) {
      // PM approved vacation, now goes to admin
      newStatus = VacationStatus.PendingAdminApproval;
      notificationMessage = `Project Manager approved vacation request for ${request.employeeName}. Waiting for Admin approval.`;
    } else if (request.type === LeaveType.PaidLeave && request.status === VacationStatus.PendingAdminApproval) {
      // Admin approves paid leave
      newStatus = VacationStatus.Approved;
      notificationMessage = `Admin approved paid leave for ${request.employeeName}.`;
    }

    dispatch({
      type: 'APPROVE_REQUEST',
      payload: { id: request.id, newStatus }
    });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: new Date().toISOString(),
        type: 'success',
        message: notificationMessage,
      }
    });
  };

  const handleReject = () => {
    dispatch({ type: 'REJECT_REQUEST', payload: { id: request.id } });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: new Date().toISOString(),
        type: 'error',
        message: `Request for ${request.employeeName} rejected.`,
      }
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this request?')) {
        dispatch({ type: 'DELETE_REQUEST', payload: { id: request.id } });
    }
  }

  const handleEdit = () => {
    dispatch({ type: 'START_EDIT', payload: { id: request.id } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Determine which actions to show based on user role and request status
  const canApprove = () => {
    if (request.employeeName === currentUserName) return false; // Can't approve own requests

    if (request.type === LeaveType.Vacation) {
      if (request.status === VacationStatus.PendingPMAproval && currentUserRoles.includes('Project Manager')) {
        return true; // PM can approve vacation first level
      }
      if (request.status === VacationStatus.PendingAdminApproval && (currentUserRoles.includes('Admin') || currentUserRoles.includes('CEO'))) {
        return true; // Admin/CEO can approve vacation second level
      }
    } else if (request.type === LeaveType.PaidLeave) {
      if (request.status === VacationStatus.PendingAdminApproval && (currentUserRoles.includes('Admin') || currentUserRoles.includes('CEO'))) {
        return true; // Admin/CEO can approve paid leave
      }
    }

    return false;
  };

  const canReject = () => canApprove(); // Same logic for rejection
  const showUserActions = !isAdmin && request.status === VacationStatus.Pending && request.employeeName === currentUserName;
  const showApprovalActions = canApprove() || canReject();

  return (
    <li className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {format(request.startDate, 'MMM d')} - {format(request.endDate, 'MMM d, yyyy')}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{request.days} day(s) &middot; <span className="font-medium">{request.type}</span></p>
          {isAdmin && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold">{request.employeeName}</p>}
        </div>
        <div className="flex items-center gap-2">
          {showUserActions && (
            <>
              <button onClick={handleEdit} className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Edit request"><PencilIcon /></button>
              <button onClick={handleDelete} className="p-1 text-slate-500 hover:text-red-600 dark:hover:text-red-400" aria-label="Delete request"><TrashIcon /></button>
            </>
          )}
          <StatusBadge status={request.status} />
        </div>
      </div>
      
      {(request.notes || showApprovalActions) && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
            {request.notes && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Note:</span> {request.notes}
                </p>
              )}

              {overlappingRequests.length > 0 && (
                 <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 p-2 rounded-md border border-red-200 dark:border-red-500/20">
                    <strong>Conflict:</strong> Also on leave: {overlappingRequests.map(r => r.employeeName).join(', ')}
                 </div>
              )}

              {showApprovalActions && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    onClick={handleReject}
                    className="!text-xs !py-1 !px-2 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    aria-label={`Reject request for ${format(request.startDate, 'MMM d')}`}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="!text-xs !py-1 !px-2 bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    aria-label={`Approve request for ${format(request.startDate, 'MMM d')}`}
                  >
                    Approve
                  </Button>
                </div>
              )}
        </div>
      )}
    </li>
  );
};


function VacationList() {
    const { requests, isAdmin, currentUser } = useVacationState();
    const [activeFilter, setActiveFilter] = useState<LeaveType | 'All'>('All');

    if (!currentUser) return null;

    const baseRequests = isAdmin ? requests : requests.filter(r => r.employeeName === currentUser.name);

   const filteredRequests = activeFilter === 'All'
     ? baseRequests
     : baseRequests.filter(r => r.type === activeFilter);

   const pending = filteredRequests.filter(r =>
     r.status === VacationStatus.Pending ||
     r.status === VacationStatus.PendingPMAproval ||
     r.status === VacationStatus.PendingAdminApproval
   );
   const approved = filteredRequests.filter(r => r.status === VacationStatus.Approved);
   const rejected = filteredRequests.filter(r => r.status === VacationStatus.Rejected);
  
  const filterOptions: (LeaveType | 'All')[] = ['All', ...Object.values(LeaveType)];

  return (
    <div>
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-4">{isAdmin ? 'All Requests' : 'My Requests'}</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.map(option => (
            <button
              key={option}
              onClick={() => setActiveFilter(option)}
              className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                activeFilter === option
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        
        <div className="space-y-6">
          {filteredRequests.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400">
                {activeFilter === 'All' ? 'You have no requests.' : `No ${activeFilter} requests found.`}
              </p>
          ) : (
          <>
            {pending.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">Pending</h3>
                <ul className="space-y-2">
                  {pending.map(req => <VacationItem key={req.id} request={req} allRequests={requests} isAdmin={isAdmin} currentUserName={currentUser.name} currentUserRoles={currentUser.roles} />)}
                </ul>
              </div>
            )}
            {approved.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">Approved</h3>
                <ul className="space-y-2">
                  {approved.map(req => <VacationItem key={req.id} request={req} allRequests={requests} isAdmin={isAdmin} currentUserName={currentUser.name} currentUserRoles={currentUser.roles} />)}
                </ul>
              </div>
            )}
            {rejected.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">Rejected</h3>
                <ul className="space-y-2">
                  {rejected.map(req => <VacationItem key={req.id} request={req} allRequests={requests} isAdmin={isAdmin} currentUserName={currentUser.name} currentUserRoles={currentUser.roles} />)}
                </ul>
              </div>
            )}
          </>
          )}
        </div>
    </div>
  );
}

export default VacationList;
