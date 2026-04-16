import React, { useState } from "react";
import {
  IoChatbubbleEllipsesOutline,
  IoClipboardOutline,
  IoSettingsOutline,
} from "react-icons/io5";

import SendSMSTab from "./components/SendSMSTab";
import ViewSMSLogsTab from "./components/ViewSMSLogsTab";
import SettingsTab from "./components/SettingsTab";

type TabKey = "send-sms" | "sms-logs" | "settings";

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "send-sms",
    label: "Send SMS",
    icon: <IoChatbubbleEllipsesOutline aria-hidden size={16} />,
  },
  {
    key: "sms-logs",
    label: "SMS Logs",
    icon: <IoClipboardOutline aria-hidden size={16} />,
  },
  {
    key: "settings",
    label: "Settings",
    icon: <IoSettingsOutline aria-hidden size={16} />,
  },
];

const CommunicationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("send-sms");

  return (
    <div className="flex flex-col gap-4">
      {/* Page header — spec: clarity-page-header */}
      <div className="clarity-page-header">
        <div>
          <h1 className="text-page-title">Communication</h1>
          <p className="text-[13px] text-mountain-400 mt-1">
            Manage SMS communications with patients and doctors
          </p>
        </div>
      </div>

      <div className="clarity-card overflow-hidden">
        {/* Tab header */}
        <div className="border-b border-[rgb(var(--color-border))]">
          <div className="flex gap-6 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`flex items-center gap-2 py-3 px-0 h-12 font-medium text-[13px] border-b-2 -mb-px transition-colors ${
                  activeTab === tab.key
                    ? "border-teal-700 text-teal-700"
                    : "border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
                }`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === "send-sms" && <SendSMSTab />}
          {activeTab === "sms-logs" && <ViewSMSLogsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
};

export default CommunicationPage;
