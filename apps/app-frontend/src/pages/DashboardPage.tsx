/**
 * flow: tenant-user-dashboard
 * step: tud_dashboard_home
 */
import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  PageSection,
  Title,
} from '@patternfly/react-core'
import {
  DEMO_TENANT_DISPLAY_USER,
  DEMO_VM_POWER_COUNTS,
  demoVmPowerTotal,
} from '@osac/api-contracts'
import type { CreateVmWizardHandle } from '../components/vm/CreateVmWizard'
import { CreateVmWizard } from '../components/vm/CreateVmWizard'
import { useSession } from '../contexts/SessionContext'
import { useComputeInstances, useProvisionVm } from '../api/hooks'
import type { VmPowerState } from '@osac/api-contracts'

interface StatCard {
  key: string
  label: string
  value: number
  valueColor: string
  caption: string
  powerFilter: VmPowerState | null
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { selectedTenant, isDarkTheme } = useSession()
  const wizardRef = useRef<CreateVmWizardHandle>(null)
  const { data: vms = [] } = useComputeInstances()
  const provisionVm = useProvisionVm()

  const tenant = selectedTenant ?? 'northstar'
  const displayName = selectedTenant ? DEMO_TENANT_DISPLAY_USER[selectedTenant] : ''
  const counts = selectedTenant && selectedTenant !== 'vertexa' ? DEMO_VM_POWER_COUNTS[selectedTenant] : { running: 0, paused: 0, stopped: 0 }
  const total = selectedTenant && selectedTenant !== 'vertexa' ? demoVmPowerTotal(selectedTenant) : 0

  const stats: StatCard[] = [
    {
      key: 'all-vms',
      label: 'All VMs',
      value: total + vms.filter((v) => v.metadata.name.startsWith('vm-clone-') || v.metadata.name.startsWith('vm-created-')).length,
      valueColor: 'var(--pf-t--global--text--color--regular)',
      caption: 'Total VMs across your workspaces',
      powerFilter: null,
    },
    {
      key: 'running',
      label: 'Running',
      value: counts.running,
      valueColor: 'var(--pf-t--global--color--status--success--default)',
      caption: 'On and ready for workloads',
      powerFilter: 'running',
    },
    {
      key: 'paused',
      label: 'Paused',
      value: counts.paused,
      valueColor: 'var(--pf-t--global--color--status--warning--default)',
      caption: 'Suspended with memory and disks retained',
      powerFilter: 'paused',
    },
    {
      key: 'stopped',
      label: 'Stopped',
      value: counts.stopped,
      valueColor: 'var(--pf-t--global--color--status--danger--default)',
      caption: 'Powered off — storage may still incur cost',
      powerFilter: 'stopped',
    },
  ]

  const handleStatCardClick = useCallback(
    (powerFilter: VmPowerState | null) => {
      const path = powerFilter ? `/vms?power=${powerFilter}` : '/vms'
      navigate(path)
    },
    [navigate],
  )

  const handleOpenCreateVm = useCallback(() => {
    wizardRef.current?.open()
  }, [])

  return (
    <PageSection isFilled>
      <CreateVmWizard
        ref={wizardRef}
        existingVms={vms}
        tenant={tenant !== 'vertexa' ? tenant : 'northstar'}
        onProvision={(vm) => provisionVm.mutate(vm)}
      />

      <div className="osac-page-toolbar-sticky">
        <div className="osac-page-toolbar-sticky__lead">
          <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
            Welcome, {displayName}
          </Title>
          <Content
            component="p"
            style={{
              margin: 0,
              color: 'var(--pf-t--global--text--color--subtle)',
              maxWidth: '48rem',
            }}
          >
            This workspace is for VM as a Service — create, run, and manage virtual machines.
          </Content>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Button variant="primary" onClick={handleOpenCreateVm}>
            Create virtual machine
          </Button>
        </div>
      </div>

      {/* VM stat cards */}
      <div className="osac-dashboard-vm-stats-grid">
        {stats.map((stat) => (
          <Card
            key={stat.key}
            isClickable
            isFullHeight
            component="article"
            className="osac-dashboard-vm-stat-card"
          >
            <CardHeader
              selectableActions={{
                onClickAction: () => handleStatCardClick(stat.powerFilter),
                selectableActionAriaLabel: `${stat.label}, ${stat.value}. ${stat.caption}`,
              }}
            >
              <CardTitle
                component="h2"
                style={{
                  fontSize: 'var(--pf-t--global--font--size--heading--xs)',
                  fontWeight: 'var(--pf-t--global--font--weight--heading--bold)',
                }}
              >
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Title
                headingLevel="h3"
                size="4xl"
                style={{ color: stat.valueColor, margin: 0 }}
              >
                {stat.value}
              </Title>
              <Content
                component="p"
                style={{
                  marginTop: 'var(--pf-t--global--spacer--xs)',
                  color: 'var(--pf-t--global--text--color--subtle)',
                  fontSize: 'var(--pf-t--global--font--size--body--sm)',
                }}
              >
                {stat.caption}
              </Content>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Utilization section */}
      <UtilizationSection isDarkTheme={isDarkTheme} vmCount={vms.length} />
    </PageSection>
  )
}

function UtilizationSection({ isDarkTheme: _isDarkTheme, vmCount }: { isDarkTheme: boolean; vmCount: number }) {
  const navigate = useNavigate()
  return (
    <div style={{ marginTop: 'var(--pf-t--global--spacer--xl)' }}>
      <Title headingLevel="h2" size="xl" style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
        Utilization overview
      </Title>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pf-t--global--spacer--md)' }}>
        <Card>
          <CardHeader>
            <CardTitle>Fleet summary</CardTitle>
          </CardHeader>
          <CardBody>
            <Content component="p">
              <strong>{vmCount}</strong> virtual machines in your workspace.
            </Content>
            <Button
              variant="link"
              isInline
              onClick={() => navigate('/activities')}
              style={{ marginTop: 'var(--pf-t--global--spacer--sm)' }}
            >
              View recent activities →
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pf-t--global--spacer--sm)' }}>
              <Button variant="link" isInline onClick={() => navigate('/vms')}>
                Manage virtual machines →
              </Button>
              <Button variant="link" isInline onClick={() => navigate('/templates')}>
                Browse templates →
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
