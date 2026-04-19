/**
 * flow: tenant-administration
 * step: tad_quota
 */
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  PageSection,
  Title,
} from '@patternfly/react-core'
import { DEMO_QUOTA } from '@osac/api-contracts'
import type { QuotaEntry } from '@osac/api-contracts'
import { useSession } from '../contexts/SessionContext'

function QuotaBar({ entry }: { entry: QuotaEntry }) {
  const pct = Math.min(100, (entry.used / entry.limit) * 100)
  const color =
    pct >= 90
      ? 'var(--pf-t--global--color--status--danger--default)'
      : pct >= 70
        ? 'var(--pf-t--global--color--status--warning--default)'
        : 'var(--pf-t--global--color--status--success--default)'

  return (
    <div style={{ marginBottom: 'var(--pf-t--global--spacer--lg)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--pf-t--global--spacer--xs)',
        }}
      >
        <Content component="p" style={{ margin: 0, fontWeight: 600 }}>
          {entry.resource}
        </Content>
        <Content
          component="p"
          style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}
        >
          {entry.used} / {entry.limit} {entry.unit}
        </Content>
      </div>
      <div className="osac-quota-bar-container">
        <div
          className="osac-quota-bar-fill"
          style={{ width: `${pct}%`, background: color }}
          role="progressbar"
          aria-valuenow={entry.used}
          aria-valuemin={0}
          aria-valuemax={entry.limit}
          aria-label={`${entry.resource} usage`}
        />
      </div>
      <Content
        component="small"
        style={{
          color: color,
          display: 'block',
          marginTop: 'var(--pf-t--global--spacer--xs)',
        }}
      >
        {pct.toFixed(0)}% used
      </Content>
    </div>
  )
}

export function AdminQuotaPage() {
  const { selectedTenant } = useSession()
  const tenant = selectedTenant === 'northstar' || selectedTenant === 'evergreen' ? selectedTenant : 'northstar'
  const quota = DEMO_QUOTA[tenant]

  return (
    <PageSection>
      <div className="osac-page-toolbar-sticky">
        <div className="osac-page-toolbar-sticky__lead">
          <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
            Quota control
          </Title>
          <Content
            component="p"
            style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}
          >
            View your organization's resource consumption and limits.
          </Content>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pf-t--global--spacer--md)' }}>
        <Card>
          <CardHeader>
            <CardTitle>Resource utilization</CardTitle>
          </CardHeader>
          <CardBody>
            {quota.map((entry) => (
              <QuotaBar key={entry.resource} entry={entry} />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quota summary</CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--pf-t--global--border--color--default)' }}>
                    {['Resource', 'Used', 'Limit', 'Unit'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: 'var(--pf-t--global--spacer--sm)',
                          textAlign: 'left',
                          color: 'var(--pf-t--global--text--color--subtle)',
                          fontWeight: 'var(--pf-t--global--font--weight--heading--bold)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quota.map((entry) => (
                    <tr
                      key={entry.resource}
                      style={{ borderBottom: '1px solid var(--pf-t--global--border--color--default)' }}
                    >
                      <td style={{ padding: 'var(--pf-t--global--spacer--sm)', fontWeight: 600 }}>
                        {entry.resource}
                      </td>
                      <td style={{ padding: 'var(--pf-t--global--spacer--sm)' }}>{entry.used}</td>
                      <td style={{ padding: 'var(--pf-t--global--spacer--sm)' }}>{entry.limit}</td>
                      <td style={{ padding: 'var(--pf-t--global--spacer--sm)', color: 'var(--pf-t--global--text--color--subtle)' }}>
                        {entry.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageSection>
  )
}
