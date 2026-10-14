import React, { useState } from 'react';
import { 
  ChevronLeft, ShieldCheck, Clock, CheckCircle2, AlertCircle, 
  RotateCcw, Activity, FolderOpen, Send, Sparkles, MessageSquare, Video 
} from 'lucide-react';
import { WorkstreamItem, WorkstreamMessage, SharedFileItem, WorkstreamSubTab } from './types';
import { UserAccount } from '../../types';
import { WorkstreamActivityStream } from './WorkstreamActivityStream';
import { WorkstreamMessageInput } from './WorkstreamMessageInput';
import { WorkstreamFilesTab } from './WorkstreamFilesTab';
import { WorkstreamSummaryCard } from './WorkstreamSummaryCard';
import { WorkstreamActionsPanel } from './WorkstreamActionsPanel';
import { WorkstreamReleaseModal } from './WorkstreamReleaseModal';
import { WorkstreamDeliverModal } from './WorkstreamDeliverModal';
import { WorkstreamRevisionModal } from './WorkstreamRevisionModal';
import { WorkstreamVideoCallModal } from './WorkstreamVideoCallModal';

interface WorkstreamWorkspaceProps {
  order: WorkstreamItem;
  messages: WorkstreamMessage[];
  files: SharedFileItem[];
  currentUser?: UserAccount | null;
  usersList?: UserAccount[];
  partner?: UserAccount;
  onBack: () => void;
  onSendMessage: (text: string) => void;
  onAttachFile: (file: { name: string; size: string; url: string }) => void;
  onReleaseEscrow: (review: { rating: number; comment: string }) => void;
  onDeliverWork: (delivery: { notes: string; files: Array<{ name: string; size: string; url: string }> }) => void;
  onRequestRevision: (reason: string) => void;
  onViewPartnerProfile?: (user: UserAccount) => void;
  onLogRequirement?: (requirementText: string) => void;
  onMissedCall?: () => void;
  onDisputeAssistance?: () => void;
}

export const WorkstreamWorkspace: React.FC<WorkstreamWorkspaceProps> = ({
  order,
  messages,
  files,
  currentUser,
  usersList = [],
  partner,
  onBack,
  onSendMessage,
  onAttachFile,
  onReleaseEscrow,
  onDeliverWork,
  onRequestRevision,
  onViewPartnerProfile,
  onDisputeAssistance,
  onLogRequirement,
  onMissedCall
}) => {
  const [activeSubTab, setActiveSubTab] = useState<WorkstreamSubTab>('activity');
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isVideoCallModalOpen, setIsVideoCallModalOpen] = useState(false);

  const handleLogRequirement = (reqText: string) => {
    if (onLogRequirement) onLogRequirement(reqText);
    const token = localStorage.getItem('workperhour_token') || localStorage.getItem('token');
    fetch(`/api/orders/${order.id}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        text: `📋 Project Requirement Logged: "${reqText}"`,
        type: 'system',
        metadata: {
          action: 'requirement_logged',
          requirementText: reqText
        }
      })
    }).then(() => {
      onSendMessage(`📋 Project Requirement Logged: "${reqText}"`);
    }).catch(() => {
      onSendMessage(`📋 Project Requirement Logged: "${reqText}"`);
    });
  };

  const handleMissedCall = () => {
    if (onMissedCall) onMissedCall();
    const token = localStorage.getItem('workperhour_token') || localStorage.getItem('token');
    fetch(`/api/orders/${order.id}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        text: `📞 Missed Video Meeting with ${partner?.name || 'collaborator'}`,
        type: 'system',
        metadata: {
          action: 'missed_call'
        }
      })
    }).then(() => {
      onSendMessage(`📞 Missed Video Meeting with ${partner?.name || 'collaborator'}`);
    }).catch(() => {
      onSendMessage(`📞 Missed Video Meeting with ${partner?.name || 'collaborator'}`);
    });
  };

  const handleDownloadFile = (f: { name: string; url: string }) => {
    if (!f.url || f.url === '#') return;
    const downloadUrl = f.url.includes('?') ? `${f.url}&download=1` : `${f.url}?download=1`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = f.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case 'completed':
        return (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase rounded-full flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Delivered · Awaiting Review</span>
          </span>
        );
      case 'revision':
        return (
          <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold uppercase rounded-full flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
            <span>Revision in Progress</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold uppercase rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Escrow Protected (${order.amount})</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* WORKSTREAM HEADER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors cursor-pointer"
            title="Back to All Workstreams"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-fiverr-dark tracking-tight">
                {order.title}
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Order #{order.id} • Partner: <strong className="text-fiverr-dark font-medium">{partner?.name || 'Collaborator'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.id === order.buyerId && order.status !== 'completed' && (
            <button
              onClick={() => setIsReleaseModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Release Escrow</span>
            </button>
          )}

          {currentUser?.id === order.sellerId && order.status !== 'completed' && (
            <button
              onClick={() => setIsDeliverModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deliver Work</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: MAIN WORKSTREAM + SUMMARY SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT COLUMN: ACTIVITY & FILES TABS (3 COLS) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[750px]">
            {/* SUBTABS HEADER */}
            <div className="flex border-b border-slate-100 bg-slate-50/70 px-6 py-2 items-center justify-between">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveSubTab('activity')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeSubTab === 'activity'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Activity Stream</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSubTab('files')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeSubTab === 'files'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Shared Files ({files.length})</span>
                  </div>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Protected by 14-Day Escrow
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
              {activeSubTab === 'activity' ? (
                <>
                  <WorkstreamActivityStream
                    messages={messages}
                    currentUserId={currentUser?.id}
                    usersList={usersList}
                    partnerUser={partner}
                    onDownloadFile={handleDownloadFile}
                  />
                  <WorkstreamMessageInput
                    key={order.id}
                    onSendMessage={onSendMessage}
                    onAttachFile={onAttachFile}
                  />
                </>
              ) : (
                <WorkstreamFilesTab
                  key={`files_${order.id}`}
                  files={files}
                  onUploadFile={onAttachFile}
                  onDownloadFile={handleDownloadFile}
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SUMMARY CARD & ACTIONS PANEL (1 COL) */}
        <div className="space-y-6">
          <WorkstreamSummaryCard
            order={order}
            partner={partner}
            currentUser={currentUser}
            onViewPartnerProfile={onViewPartnerProfile}
          />

          <WorkstreamActionsPanel
            order={order}
            currentUser={currentUser}
            onOpenReleaseModal={() => setIsReleaseModalOpen(true)}
            onOpenDeliverModal={() => setIsDeliverModalOpen(true)}
            onOpenRevisionModal={() => setIsRevisionModalOpen(true)}
            onStartVideoCall={() => setIsVideoCallModalOpen(true)}
            onAttachFiles={() => setActiveSubTab('files')}
            onDisputeAssistance={onDisputeAssistance}
          />
        </div>
      </div>

      {/* MODALS */}
      <WorkstreamVideoCallModal
        key={`video_${order.id}`}
        isOpen={isVideoCallModalOpen}
        order={order}
        currentUser={currentUser}
        partner={partner}
        onClose={() => setIsVideoCallModalOpen(false)}
        onLogRequirement={handleLogRequirement}
        onMissedCall={handleMissedCall}
      />

      <WorkstreamReleaseModal
        key={`release_${order.id}`}
        isOpen={isReleaseModalOpen}
        order={order}
        onClose={() => setIsReleaseModalOpen(false)}
        onConfirm={onReleaseEscrow}
      />

      <WorkstreamDeliverModal
        key={`deliver_${order.id}`}
        isOpen={isDeliverModalOpen}
        order={order}
        onClose={() => setIsDeliverModalOpen(false)}
        onSubmitDelivery={onDeliverWork}
      />

      <WorkstreamRevisionModal
        key={`revision_${order.id}`}
        isOpen={isRevisionModalOpen}
        order={order}
        onClose={() => setIsRevisionModalOpen(false)}
        onSubmitRevision={onRequestRevision}
      />
    </div>
  );
};
