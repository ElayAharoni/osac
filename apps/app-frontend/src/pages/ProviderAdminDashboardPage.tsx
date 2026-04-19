/**
 * flow: provider-administration
 * step: pad_dashboard_home
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
import { DEMO_ORGANIZATIONS } from '@osac/api-contracts'
import { useComputeInstances } from '../api/hooks'

const PROVIDER_TILES = [
  { id: 'tenant-organizations', label: 'Tenant organizations', icon: '🏢', desc: 'Manage and view all tenant organizations.', path: '/provider/organizations' },
  { id: 'resource-allocation', label: 'Resource allocation', icon: '⚖️', desc: 'Manage capacity pools and fair-share limits.', path: '/provider/allocation' },
  { id: 'global-templates', label: 'Global templates', icon: '📋', desc: 'Provider-wide template library.', path: '/provider/templates' },
  { id: 'infrastructure', label: 'Infrastructure', icon: '🖥️', desc: 'View platform infrastructure topology.', path: '/provider/infrastructure' },
]

export function ProviderAdminDashboardPage() {
  const navigate = useNavigate()
  const { data: vms = [] } = useComputeInstances()
  const totalVms = DEMO_ORGANIZATIONS.reduce((acc, o) => acc + (o.vmCount ?? 0), 0)

  return (
    <PageSection>
      <div className="osac-page-toolbar-sticky">
        <div className="osac-page-toolbar-sticky__lead">
          <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
            Provider Dashboard
          </Title>
          <Content component="p" style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}>
            Cross-tenant platform overview for Vertexa Cloud Solutions.
          </Content>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 'var(--pf-t--global--spacer--md)', marginBottom: 'var(--pf-t--global--spacer--xl)', flexWrap: 'wrap' }}>
        <SummaryBadge label="Tenant orgs" value={DEMO_ORGANIZATIONS.length} />
        <SummaryBadge label="Total VMs" value={vms.length + totalVms} />
        <SummaryBadge label="Active tenants" value={DEMO_ORGANIZATIONS.filter((o) => o.status === 'active').length} />
      </div>

      {/* Navigation tiles */}
      <Title headingLevel="h2" size="xl" style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
        Management areas
      </Title>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 'var(--pf-t--global--spacer--md)',
        }}
      >
        {PROVIDER_TILES.map((tile) => (
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
                Open →
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </PageSection>
  )
}

function SummaryBadge({ label, value }: { label: string; value: number }) {
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
