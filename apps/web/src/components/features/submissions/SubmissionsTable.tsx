'use client';


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarangaySubmission } from '@/types/submissions';
import { Play, Eye, Clock } from 'lucide-react';

interface SubmissionsTableProps {
  submissions: BarangaySubmission[];
  onSubmissionClick: (submission: BarangaySubmission) => void;
}

export function SubmissionsTable({ submissions, onSubmissionClick }: SubmissionsTableProps) {

  const getStatusBadge = (status: BarangaySubmission['areaStatus']) => {
    const statusConfig = {
      awaiting_review: { label: 'Awaiting Review', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
      needs_rework: { label: 'Needs Rework', color: 'bg-orange-100 text-orange-800' },
      validated: { label: 'Validated', color: 'bg-green-100 text-green-800' },
    };

    const config = statusConfig[status];
    return (
      <Badge variant="secondary" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getOverallStatusBadge = (status: BarangaySubmission['overallStatus']) => {
    const statusConfig = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
      under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
      needs_rework: { label: 'Needs Rework', color: 'bg-orange-100 text-orange-800' },
      validated: { label: 'Validated', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800' },
    };

    const config = statusConfig[status];
    return (
      <Badge variant="secondary" className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getActionButton = (submission: BarangaySubmission) => {
    const { areaStatus } = submission;

    if (areaStatus === 'awaiting_review') {
      return (
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSubmissionClick(submission);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Play className="h-4 w-4 mr-2" />
          Start Review
        </Button>
      );
    }

    if (areaStatus === 'in_progress') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onSubmissionClick(submission);
          }}
          className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <Clock className="h-4 w-4 mr-2" />
          Continue Review
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onSubmissionClick(submission);
        }}
        className="text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)] transition-all duration-200 transform hover:scale-105"
      >
        <Eye className="h-4 w-4 mr-2" />
        View Submission
      </Button>
    );
  };

  const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
  return date.toLocaleDateString();
}
  };

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--border)] bg-gradient-to-r from-[var(--muted)] to-[var(--card)]">
              <TableHead className="text-[var(--foreground)] font-semibold text-sm py-4 px-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Barangay Name</span>
                </div>
              </TableHead>
              <TableHead className="text-[var(--foreground)] font-semibold text-sm py-4 px-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Progress (in this Area)</span>
                </div>
              </TableHead>
              <TableHead className="text-[var(--foreground)] font-semibold text-sm py-4 px-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Status (in this Area)</span>
                </div>
              </TableHead>
              <TableHead className="text-[var(--foreground)] font-semibold text-sm py-4 px-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Overall Status</span>
                </div>
              </TableHead>
              <TableHead className="text-[var(--foreground)] font-semibold text-sm py-4 px-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>Last Updated</span>
                </div>
              </TableHead>
              <TableHead className="text-[var(--foreground)] font-semibold text-sm py-4 px-6 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-[var(--cityscape-yellow)] rounded-full"></div>
                  <span>Actions</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission, index) => (
              <TableRow 
                key={submission.id} 
                className={`border-[var(--border)] hover:bg-gradient-to-r hover:from-[var(--hover)] hover:to-[var(--muted)] transition-all duration-200 cursor-pointer ${
                  index % 2 === 0 ? 'bg-[var(--card)]' : 'bg-[var(--muted)]'
                }`}
                onClick={() => onSubmissionClick(submission)}
              >
                <TableCell className="font-semibold text-[var(--foreground)] py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] rounded-full flex items-center justify-center text-[var(--cityscape-accent-foreground)] text-sm font-bold">
                      {submission.barangayName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">
                        {submission.barangayName}
                      </div>
                      {submission.assignedTo && (
                        <div className="text-xs text-[var(--text-muted)]">
                          Assigned to: {submission.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Progress 
                        value={submission.areaProgress} 
                        className="h-2 bg-[var(--muted)]"
                      />
                    </div>
                    <span className="text-sm font-semibold text-[var(--foreground)] min-w-[3rem] text-right">
                      {submission.areaProgress}%
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">
                    {submission.areaProgress < 25 && 'Just started'}
                    {submission.areaProgress >= 25 && submission.areaProgress < 50 && 'In progress'}
                    {submission.areaProgress >= 50 && submission.areaProgress < 75 && 'Nearly complete'}
                    {submission.areaProgress >= 75 && submission.areaProgress < 100 && 'Almost done'}
                    {submission.areaProgress === 100 && 'Complete'}
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                  {getStatusBadge(submission.areaStatus)}
                </TableCell>
                <TableCell className="py-4 px-6">
                  {getOverallStatusBadge(submission.overallStatus)}
                </TableCell>
                <TableCell className="text-[var(--text-secondary)] text-sm py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-[var(--text-muted)] rounded-full"></div>
                    <span>{formatDate(submission.lastUpdated)}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex justify-center">
                    {getActionButton(submission)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 