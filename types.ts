import { ReactNode } from 'react';

export enum LeaveType {
  Vacation = 'Vacation',
  PaidLeave = 'Paid Leave',
  SickLeave = 'Sick Leave',
}

export enum WorkType {
  Office = 'Work from office',
  Home = 'Work from home',
  BusinessTrip = 'Business trip',
}

export enum VacationStatus {
   Pending = 'Pending',
   PendingPMAproval = 'Pending PM Approval',
   PendingAdminApproval = 'Pending Admin Approval',
   Approved = 'Approved',
   Rejected = 'Rejected',
}

export interface User {
    id?: number;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: ('Admin' | 'Employee' | 'Project Manager' | 'CEO')[];
    vacationDays: number;
    paidLeaveDays: number;
    discordId?: string;
}

export interface VacationRequest {
  id: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  days: number;
  status: VacationStatus;
  type: LeaveType;
  notes?: string;
}

export interface TimeEntry {
   id: string;
   employeeName: string;
   date: Date;
   workType: WorkType;
   lastClockIn?: Date;
   isClockedIn: boolean;
   breaks: { start: Date; end?: Date }[];
   offs: { start: Date; end?: Date }[];
   totalWorkingMinutes: number;
 }

export type NotificationType = 'success' | 'error';

export interface Notification {
  id: string;
  message: ReactNode;
  type: NotificationType;
}
