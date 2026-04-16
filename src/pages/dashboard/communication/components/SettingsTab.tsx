import React, { useState, useEffect } from "react";
import { RefreshCwIcon } from "lucide-react";

import { addToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import {
  getSMSSettings,
  updateSMSSettings,
  createDefaultSMSSettings,
  SMSSettings,
} from "@/services/sendMessageService";
import { appointmentTypeService } from "@/services/appointmentTypeService";

interface AppointmentType {
  id: string;
  name: string;
  clinicId: string;
}

const SettingsTab: React.FC = () => {
  const { clinicId, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SMSSettings | null>(null);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(
    [],
  );

  const [enableReminders, setEnableReminders] = useState(true);
  const [reminderHours, setReminderHours] = useState(24);
  const [maxDailySMS, setMaxDailySMS] = useState(100);
  const [smsAppointmentType, setSmsAppointmentType] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!clinicId) return;
      setLoading(true);
      try {
        const [settingsData, appointmentTypesData] = await Promise.all([
          getSMSSettings(clinicId),
          appointmentTypeService.getActiveAppointmentTypesByClinic(clinicId),
        ]);

        if (settingsData) {
          const today = new Date().toISOString().split("T")[0];
          const lastResetDate = settingsData.lastResetDate || "";

          if (lastResetDate !== today) {
            await updateSMSSettings(
              clinicId,
              { currentDailySMS: 0, lastResetDate: today },
              currentUser?.uid || "system",
            );
            const updatedSettings = {
              ...settingsData,
              currentDailySMS: 0,
              lastResetDate: today,
            };

            setSettings(updatedSettings);
            setEnableReminders(updatedSettings.enableReminders);
            setReminderHours(updatedSettings.reminderHours);
            setMaxDailySMS(updatedSettings.maxDailySMS);
            setSmsAppointmentType(updatedSettings.smsAppointmentType || "");
          } else {
            setSettings(settingsData);
            setEnableReminders(settingsData.enableReminders);
            setReminderHours(settingsData.reminderHours);
            setMaxDailySMS(settingsData.maxDailySMS);
            setSmsAppointmentType(settingsData.smsAppointmentType || "");
          }
        } else {
          await createDefaultSMSSettings(
            clinicId,
            null,
            currentUser?.uid || "system",
          );
          const newSettings = await getSMSSettings(clinicId);

          if (newSettings) {
            setSettings(newSettings);
            setEnableReminders(newSettings.enableReminders);
            setReminderHours(newSettings.reminderHours);
            setMaxDailySMS(newSettings.maxDailySMS);
            setSmsAppointmentType(newSettings.smsAppointmentType || "");
          }
        }
        setAppointmentTypes(appointmentTypesData);
      } catch (error) {
        console.error("Error loading settings:", error);
        addToast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clinicId]);

  const handleSaveSettings = async () => {
    if (!clinicId) {
      addToast({
        title: "Error",
        description: "Clinic ID not found.",
        color: "danger",
      });

      return;
    }
    setSaving(true);
    try {
      const updatedSettings: Partial<SMSSettings> = {
        enableReminders,
        reminderHours,
        maxDailySMS,
        smsAppointmentType,
      };

      await updateSMSSettings(
        clinicId,
        updatedSettings,
        currentUser?.uid || "system",
      );
      setSettings((prev) => (prev ? { ...prev, ...updatedSettings } : null));
      addToast({
        title: "Success",
        description: "Settings saved successfully",
        color: "success",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      addToast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setEnableReminders(true);
    setReminderHours(24);
    setMaxDailySMS(100);
    setSmsAppointmentType("");
  };

  const refreshUsage = () => {
    if (clinicId) {
      getSMSSettings(clinicId).then((updated) => {
        if (updated) setSettings(updated);
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 text-[rgb(var(--color-text-muted))]">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-base font-semibold text-[rgb(var(--color-text))]">
          SMS Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--color-text-muted))] mb-1">
              Max Daily SMS
            </label>
            <input
              aria-label="Max daily SMS"
              className="clarity-input w-full"
              max={10000}
              min={1}
              type="number"
              value={maxDailySMS}
              onChange={(e) => setMaxDailySMS(parseInt(e.target.value) || 100)}
            />
            <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
              Maximum number of SMS messages per day
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[rgb(var(--color-text))]">
                Current Usage
              </span>
              <button
                aria-label="Refresh usage"
                className="clarity-btn clarity-btn-ghost h-8 w-8 p-0 justify-center"
                type="button"
                onClick={refreshUsage}
              >
                <RefreshCwIcon aria-hidden size={14} />
              </button>
            </div>
            <div className="text-sm text-[rgb(var(--color-text-muted))]">
              {settings?.currentDailySMS || 0} / {maxDailySMS} SMS sent today
            </div>
            <div className="w-full h-2 rounded-full bg-[rgb(var(--color-surface-2))] overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-300"
                style={{
                  width: `${Math.min(((settings?.currentDailySMS || 0) / maxDailySMS) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="text-xs text-[rgb(var(--color-text-muted))]">
              {maxDailySMS - (settings?.currentDailySMS || 0)} SMS remaining
              today
            </div>
          </div>
        </div>

        <button
          className="clarity-btn clarity-btn-ghost text-saffron-600 hover:text-saffron-700"
          type="button"
          onClick={handleResetDefaults}
        >
          Reset to Defaults
        </button>
      </div>

      <div className="clarity-divider" />

      <div className="space-y-4">
        <h4 className="text-base font-semibold text-[rgb(var(--color-text))]">
          Appointment Reminders
        </h4>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              aria-label="Enable reminders"
              checked={enableReminders}
              className="w-4 h-4 rounded border-mountain-300 text-teal-600 focus:ring-teal-500"
              type="checkbox"
              onChange={(e) => setEnableReminders(e.target.checked)}
            />
            <span className="text-sm text-[rgb(var(--color-text))]">
              Enable automatic appointment reminders
            </span>
          </label>
        </div>

        {enableReminders && (
          <div className="space-y-4 ml-6">
            <div className="clarity-card p-4">
              <h5 className="font-medium text-sm mb-3 text-[rgb(var(--color-text))]">
                Smart Scheduling Rules
              </h5>
              <div className="space-y-2 text-sm text-[rgb(var(--color-text-muted))]">
                <div className="flex items-center gap-2">
                  <span className="text-health-600">✅</span>
                  <span>
                    <strong>24+ hours away:</strong> Schedule reminder using
                    your advance notice setting
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-600">🔄</span>
                  <span>
                    <strong>4-24 hours away:</strong> Automatically adjust to 2
                    hours before appointment
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-saffron-600">⚡</span>
                  <span>
                    <strong>2-4 hours away:</strong> Schedule 1 hour before
                    appointment
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-600">❌</span>
                  <span>
                    <strong>Less than 2 hours:</strong> Skip reminder (too
                    close)
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--color-text-muted))] mb-1">
                  Advance Notice Hours
                </label>
                <input
                  aria-label="Advance notice hours"
                  className="clarity-input w-full"
                  max={168}
                  min={1}
                  placeholder="24"
                  type="number"
                  value={reminderHours}
                  onChange={(e) =>
                    setReminderHours(parseInt(e.target.value) || 24)
                  }
                />
                <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                  How many hours before to remind for appointments scheduled 24+
                  hours in advance
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[rgb(var(--color-text-muted))] mb-1">
                  Appointment Type for SMS
                </label>
                <select
                  aria-label="Appointment type for SMS"
                  className="clarity-input w-full"
                  value={smsAppointmentType}
                  onChange={(e) => setSmsAppointmentType(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {appointmentTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                  Only send reminders for this appointment type
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="clarity-divider" />

      <div className="space-y-4">
        <h4 className="text-base font-semibold text-[rgb(var(--color-text))]">
          Statistics
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="clarity-card p-4 text-center">
            <div className="text-xl font-bold text-teal-700">
              {settings?.currentDailySMS || 0}
            </div>
            <div className="text-sm text-[rgb(var(--color-text-muted))]">
              SMS Today
            </div>
          </div>
          <div className="clarity-card p-4 text-center">
            <div className="text-xl font-bold text-health-600">
              {maxDailySMS - (settings?.currentDailySMS || 0)}
            </div>
            <div className="text-sm text-[rgb(var(--color-text-muted))]">
              Remaining Today
            </div>
          </div>
          <div className="clarity-card p-4 text-center">
            <div className="text-xl font-bold text-saffron-600">
              {reminderHours}h
            </div>
            <div className="text-sm text-[rgb(var(--color-text-muted))]">
              Reminder Lead Time
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          className="clarity-btn clarity-btn-primary"
          disabled={saving}
          type="button"
          onClick={handleSaveSettings}
        >
          {saving ? "Saving Settings…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default SettingsTab;
