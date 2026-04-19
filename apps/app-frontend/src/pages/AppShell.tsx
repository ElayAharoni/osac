/**
 * flow: application-shell-session
 * step: shell_primary_workspace
 *
 * Authenticated application shell — masthead, sidebar nav (role-based), breadcrumb.
 */
import { useCallback, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Label,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  MenuToggle,
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  Page,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { BarsIcon } from '@patternfly/react-icons/dist/esm/icons/bars-icon'
import { BellIcon } from '@patternfly/react-icons/dist/esm/icons/bell-icon'
import { CogIcon } from '@patternfly/react-icons/dist/esm/icons/cog-icon'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon'
import { UserIcon } from '@patternfly/react-icons/dist/esm/icons/user-icon'

import {
  DEMO_PROVIDER_ADMIN_DISPLAY_NAME,
  DEMO_TENANT_DISPLAY_ADMIN,
  DEMO_TENANT_DISPLAY_USER,
  DEMO_TENANT_SOVEREIGNTY,
  demoOperatingModeLabel,
} from '@osac/api-contracts'
import { LightDarkToggle } from '@osac/ui-components'
import { useSession } from '../contexts/SessionContext'

// Pages
import { DashboardPage } from './DashboardPage'
import { VmListPage } from './VmListPage'
import { CatalogPage } from './CatalogPage'
import { RecentActivitiesPage } from './RecentActivitiesPage'
import { AdminDashboardPage } from './AdminDashboardPage'
import { AdminUsersPage } from './AdminUsersPage'
import { AdminQuotaPage } from './AdminQuotaPage'
import { AdminNetworksPage } from './AdminNetworksPage'
import { ProviderAdminDashboardPage } from './ProviderAdminDashboardPage'
import { ProviderTenantOrgsPage } from './ProviderTenantOrgsPage'
import { ProviderInfraTopologyPage } from './ProviderInfraTopologyPage'
import { PlaceholderPage } from '@osac/ui-components'

// ---------------------------------------------------------------------------
// Nav definition types
// ---------------------------------------------------------------------------

type NavRow =
  | { kind: 'link'; id: string; label: string; path: string }
  | { kind: 'expand'; label: string; groupId: string; children: { id: string; label: string; path: string }[] }

const TENANT_USER_NAV: NavRow[] = [
  { kind: 'link', id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { kind: 'link', id: 'compute-vms', label: 'My VMs', path: '/vms' },
  { kind: 'link', id: 'catalog', label: 'Templates', path: '/templates' },
]

const TENANT_ADMIN_NAV: NavRow[] = [
  { kind: 'link', id: 'admin-dashboard', label: 'Dashboard', path: '/admin/dashboard' },
  {
    kind: 'expand',
    label: 'Management',
    groupId: 'nav-admin-mgmt',
    children: [
      { id: 'admin-users', label: 'Users', path: '/admin/users' },
      { id: 'admin-quota', label: 'Quota control', path: '/admin/quota' },
      { id: 'admin-templates', label: 'Template catalog', path: '/admin/templates' },
    ],
  },
  {
    kind: 'expand',
    label: 'Infrastructure',
    groupId: 'nav-admin-infra',
    children: [
      { id: 'admin-networks', label: 'Networks', path: '/admin/networks' },
      { id: 'admin-storage', label: 'Storage', path: '/admin/storage' },
    ],
  },
  {
    kind: 'expand',
    label: 'Organization',
    groupId: 'nav-admin-org',
    children: [
      { id: 'admin-org-settings', label: 'Organization settings', path: '/admin/org-settings' },
      { id: 'admin-org-security', label: 'Security & Compliance', path: '/admin/security' },
    ],
  },
]

const PROVIDER_ADMIN_NAV: NavRow[] = [
  { kind: 'link', id: 'provider-dashboard', label: 'Dashboard', path: '/provider/dashboard' },
  {
    kind: 'expand',
    label: 'Management',
    groupId: 'nav-provider-mgmt',
    children: [
      { id: 'provider-orgs', label: 'Tenant organizations', path: '/provider/organizations' },
      { id: 'provider-allocation', label: 'Resource allocation', path: '/provider/allocation' },
      { id: 'provider-templates', label: 'Global templates', path: '/provider/templates' },
    ],
  },
  {
    kind: 'expand',
    label: 'System',
    groupId: 'nav-provider-system',
    children: [
      { id: 'provider-infra', label: 'Infrastructure', path: '/provider/infrastructure' },
      { id: 'provider-security', label: 'Security & Compliance', path: '/provider/security' },
      { id: 'provider-settings', label: 'Platform settings', path: '/provider/settings' },
    ],
  },
]

// ---------------------------------------------------------------------------
// AppShell component
// ---------------------------------------------------------------------------

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    selectedTenant,
    role,
    isDarkTheme,
    setIsDarkTheme,
    logout,
    openTopologyDetailRequest,
  } = useSession()

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(['nav-admin-mgmt', 'nav-admin-infra', 'nav-admin-org', 'nav-provider-mgmt', 'nav-provider-system']),
  )

  const isRecentActivities = location.pathname === '/activities'

  const navRows = useMemo(() => {
    if (role === 'providerAdmin') return PROVIDER_ADMIN_NAV
    if (role === 'tenantAdmin') return TENANT_ADMIN_NAV
    return TENANT_USER_NAV
  }, [role])

  const toggleGroup = useCallback((groupId: string, expanded: boolean) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (expanded) next.add(groupId)
      else next.delete(groupId)
      return next
    })
  }, [])

  const displayName = useMemo(() => {
    if (!selectedTenant) return ''
    if (role === 'providerAdmin') return DEMO_PROVIDER_ADMIN_DISPLAY_NAME
    if (role === 'tenantAdmin') return DEMO_TENANT_DISPLAY_ADMIN[selectedTenant]
    return DEMO_TENANT_DISPLAY_USER[selectedTenant]
  }, [role, selectedTenant])

  const sovereignty = selectedTenant ? DEMO_TENANT_SOVEREIGNTY[selectedTenant] : null

  // ---------------------------------------------------------------------------
  // Masthead
  // ---------------------------------------------------------------------------

  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton variant="plain" aria-label="Global navigation">
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadLogo>
          <MastheadBrand>
            <span
              style={{
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: '-0.5px',
                color: 'var(--pf-t--global--text--color--regular)',
              }}
            >
              {selectedTenant === 'vertexa'
                ? '✦ Vertexa Cloud'
                : selectedTenant === 'northstar'
                  ? '⭐ Northstar Bank'
                  : '◆ Bluestone'}
            </span>
          </MastheadBrand>
        </MastheadLogo>

        <div className="osac-masthead-user-cluster">
          <Dropdown
            isOpen={isUserMenuOpen}
            onSelect={() => setIsUserMenuOpen(false)}
            onOpenChange={setIsUserMenuOpen}
            popperProps={{ position: 'right' }}
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                isExpanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen((o) => !o)}
                icon={<UserIcon />}
                aria-label="Account menu"
              >
                {displayName}
              </MenuToggle>
            )}
          >
            <DropdownList>
              <DropdownItem value="profile" onClick={(e) => e.preventDefault()}>
                Account settings
              </DropdownItem>
              <DropdownItem value="logout" onClick={logout}>
                Log out
              </DropdownItem>
            </DropdownList>
          </Dropdown>
          <Label color="grey" variant="outline" isCompact className="osac-masthead-operating-mode">
            {demoOperatingModeLabel(role)}
          </Label>
        </div>
      </MastheadMain>

      <MastheadContent>
        <span style={{ flex: 1 }} aria-hidden />
        {sovereignty && (
          <div className="osac-masthead-context-cluster">
            <div className="osac-masthead-tenant-trust-strip" aria-label="Data residency and compliance">
              <div className="osac-masthead-tenant-trust-strip__residency">
                <span className="osac-masthead-region-flag" role="img" aria-label={sovereignty.regionAriaLabel}>
                  {sovereignty.regionEmoji}
                </span>
                <span className="osac-masthead-region-line" title={sovereignty.regionLine}>
                  {sovereignty.regionLine}
                </span>
              </div>
              <div className="osac-masthead-tenant-trust-strip__compliance">
                {sovereignty.complianceLabels.map((tag) => (
                  <Label
                    key={tag.text}
                    color={tag.color}
                    variant="outline"
                    isCompact
                  >
                    {tag.text}
                  </Label>
                ))}
              </div>
              {sovereignty.egressNote && (
                <div className="osac-masthead-tenant-trust-strip__egress">
                  {sovereignty.egressNote}
                </div>
              )}
            </div>
          </div>
        )}
        <Toolbar>
          <ToolbarContent alignItems="center">
            <ToolbarGroup align={{ default: 'alignEnd' }} variant="action-group-plain" gap={{ default: 'gapSm' }}>
              <ToolbarItem>
                <Button
                  variant="plain"
                  aria-label="Recent activities"
                  onClick={() => navigate('/activities')}
                >
                  <BellIcon />
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <Button variant="plain" aria-label="Help" onClick={(e) => e.preventDefault()}>
                  <OutlinedQuestionCircleIcon />
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <Button variant="plain" aria-label="Settings" onClick={(e) => e.preventDefault()}>
                  <CogIcon />
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  )

  // ---------------------------------------------------------------------------
  // Sidebar nav
  // ---------------------------------------------------------------------------

  const sidebar = (
    <PageSidebar>
      <PageSidebarBody isFilled>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            width: '100%',
          }}
        >
          <Nav aria-label="Primary navigation">
            <NavList>
              {navRows.map((row) => {
                if (row.kind === 'link') {
                  return (
                    <NavItem
                      key={row.id}
                      itemId={row.id}
                      isActive={location.pathname === row.path}
                      to={row.path}
                      onClick={(e) => {
                        e.preventDefault()
                        navigate(row.path)
                      }}
                    >
                      {row.label}
                    </NavItem>
                  )
                }
                return (
                  <NavExpandable
                    key={row.groupId}
                    title={row.label}
                    groupId={row.groupId}
                    isExpanded={expandedGroups.has(row.groupId)}
                    onExpand={(_e, expanded) => toggleGroup(row.groupId, expanded)}
                    isActive={row.children.some((c) => location.pathname === c.path)}
                  >
                    {row.children.map((child) => (
                      <NavItem
                        key={child.id}
                        itemId={child.id}
                        groupId={row.groupId}
                        isActive={location.pathname === child.path}
                        to={child.path}
                        onClick={(e) => {
                          e.preventDefault()
                          navigate(child.path)
                        }}
                      >
                        {child.label}
                      </NavItem>
                    ))}
                  </NavExpandable>
                )
              })}
            </NavList>
          </Nav>

          <div className="osac-shell-sidebar-footer">
            <LightDarkToggle
              variant="shell"
              isDark={isDarkTheme}
              onChange={setIsDarkTheme}
              landingOnSelect={logout}
              landingAriaLabel="Back to welcome — choose institution and role"
              aria-label="Toggle theme"
            />
          </div>
        </div>
      </PageSidebarBody>
    </PageSidebar>
  )

  // ---------------------------------------------------------------------------
  // Breadcrumb (recent activities only)
  // ---------------------------------------------------------------------------

  const breadcrumb = isRecentActivities ? (
    <Breadcrumb>
      <BreadcrumbItem>
        <Button
          variant="link"
          isInline
          onClick={() => {
            navigate(role === 'providerAdmin' ? '/provider/dashboard' : '/dashboard')
          }}
        >
          Dashboard
        </Button>
      </BreadcrumbItem>
      <BreadcrumbItem isActive>Recent activities</BreadcrumbItem>
    </Breadcrumb>
  ) : undefined

  // ---------------------------------------------------------------------------
  // Main content routes
  // ---------------------------------------------------------------------------

  const defaultRoute =
    role === 'providerAdmin'
      ? '/provider/dashboard'
      : role === 'tenantAdmin'
        ? '/admin/dashboard'
        : '/dashboard'

  return (
    <Page masthead={masthead} sidebar={sidebar} breadcrumb={breadcrumb} isManagedSidebar>
      <Routes>
        {/* Tenant user routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vms/*" element={<VmListPage />} />
        <Route path="/templates" element={<CatalogPage />} />
        <Route path="/activities" element={<RecentActivitiesPage />} />

        {/* Tenant admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/quota" element={<AdminQuotaPage />} />
        <Route path="/admin/templates" element={<CatalogPage />} />
        <Route path="/admin/networks" element={<AdminNetworksPage onOpenVmDetail={openTopologyDetailRequest} />} />
        <Route path="/admin/storage" element={<PageWrapper><PlaceholderPage title="Storage" lede="Disk pools, snapshots, and backup policies for your tenant." /></PageWrapper>} />
        <Route path="/admin/org-settings" element={<PageWrapper><PlaceholderPage title="Organization settings" lede="Branding, identity providers, and tenant-wide defaults." /></PageWrapper>} />
        <Route path="/admin/security" element={<PageWrapper><PlaceholderPage title="Security & Compliance" lede="Audit logs, policy packs, and compliance reporting." /></PageWrapper>} />

        {/* Provider admin routes */}
        <Route path="/provider/dashboard" element={<ProviderAdminDashboardPage />} />
        <Route path="/provider/organizations" element={<ProviderTenantOrgsPage />} />
        <Route path="/provider/allocation" element={<PageWrapper><PlaceholderPage title="Resource allocation" lede="Capacity pools, region quotas, and fair-share limits across tenants." /></PageWrapper>} />
        <Route path="/provider/templates" element={<CatalogPage isProviderGlobal />} />
        <Route path="/provider/infrastructure" element={<ProviderInfraTopologyPage />} />
        <Route path="/provider/security" element={<PageWrapper><PlaceholderPage title="Security & Compliance" lede="Platform-wide policies, encryption standards, and audit exports." /></PageWrapper>} />
        <Route path="/provider/settings" element={<PageWrapper><PlaceholderPage title="Platform settings" lede="Feature flags, integrations, maintenance windows, and API endpoints." /></PageWrapper>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Page>
  )
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 'var(--pf-t--global--spacer--xl)' }}>
      {children}
    </div>
  )
}
