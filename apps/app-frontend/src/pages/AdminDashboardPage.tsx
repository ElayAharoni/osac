/**
 * flow: tenant-administration
 * step: tad_dashboard_home
 */
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Content,
  PageSection,
  Title,
} from '@patternfly/react-core'
import { DEMO_TENANT_LABEL } from '@osac/api-contracts'
import { useSession } from '../contexts/SessionContext'
import { useComputeInstances } from '../api/hooks'

const TILES = [
  { id: 'users', label: 'User management', icon: '👥', desc: 'Manage tenant users and access.', path: '/admin/users' },
  { id: 'quota', label: 'Quota control', icon: '📊', desc: 'View and adjust vCPU, memory, and storage quotas.', path: '/admin/quota' },
  { id: 'templates', label: 'Template catalog', icon: '📋', desc: 'Browse and manage VM templates.', path: '/admin/templates' },
  { id: 'networks', label: 'Networks', icon: '🔗', desc: 'Visualize virtual networks and VM topology.', path: '/admin/networks' },
  { id: 'storage', label: 'Storage', icon: '💾', desc: 'Disk pools, snapshots, and backup policies.', path: '/admin/storage' },
]

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { selectedTenant } = useSession()
  const { data: vms = [] } = useComputeInstances()
  const tenantLabel = selectedTenant ? DEMO_TENANT_LABEL[selectedTenant] : 'Tenant'

  return (
    <PageSection>
      <div className="osac-page-toolbar-sticky">
        <div className="osac-page-toolbar-sticky__lead">
          <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
            Dashboard
          </Title>
          <Content
            component="p"
            style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}
          >
            Tenant administration for {tenantLabel}
          </Content>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 'var(--pf-t--global--spacer--md)', marginBottom: 'var(--pf-t--global--spacer--xl)', flexWrap: 'wrap' }}>
        <StatBadge label="Total VMs" value={vms.length} />
        <StatBadge label="Running" value={vms.filter((v) => v.status.state === 'running').length} />
        <StatBadge label="Users" value={selectedTenant === 'northstar' ? 5 : 4} />
      </div>

      {/* Navigation tiles */}
      <Title headingLevel="h2" size="xl" style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
        Administration areas
      </Title>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 'var(--pf-t--global--spacer--md)',
        }}
      >
        {TILES.map((tile) => (
          <Card key={tile.id} isFullHeight>
            <CardHeader>
              <CardTitle>
                <span style={{ marginRight: 'var(--pf-t--global--spacer--xs)' }}>{tile.icon}</span>
                {tile.label}
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
                {tile.desc}
              </Content>
            </CardBody>
            <CardFooter>
              <Button variant="link" isInline onClick={() => navigate(tile.path)}>
                Go to {tile.label.toLowerCase()} →
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </PageSection>
  )
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--pf-t--global--spacer--md) var(--pf-t--global--spacer--xl)',
        border: '1px solid var(--pf-t--global--border--color--default)',
        borderRadius: 'var(--pf-t--global--border--radius--medium)',
        background: 'var(--pf-t--global--background--color--secondary--default)',
        minWidth: 100,
      }}
    >
      <Title headingLevel="h3" size="3xl" style={{ margin: 0 }}>{value}</Title>
      <Content component="small" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
        {label}
      </Content>
    </div>
  )
}
