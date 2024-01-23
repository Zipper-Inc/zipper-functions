import React, { ReactNode } from 'react';
import { DashboardSettingsNav } from '../../components/settings-nav';
import DashboardLayout from '../../layout';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const SETTINGS_NAV_MENU = [
  { label: 'General', href: '/settings' },
  { label: 'Billing', href: '/settings/billing', disabled: true },
  { label: 'Security & Privacy', href: '/settings/security', disabled: true },
];

/* -------------------------------------------- */
/* Render                                       */
/* -------------------------------------------- */

const SettingsLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-4 gap-9">
        <section className="flex flex-col col-span-1 gap-6">
          <article className="flex flex-col col-span-1 gap-2">
            <h3 className="font-medium text-3xl">Settings</h3>
            <p>Manage settings for this organization.</p>
          </article>
          <DashboardSettingsNav data={SETTINGS_NAV_MENU} />
        </section>

        <section className="flex col-span-3 flex-col gap-6 items-start">
          {children}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default SettingsLayout;
