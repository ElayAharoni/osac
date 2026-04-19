/**
 * flow: provider-administration
 * step: pad_tenant_organizations
 */
import {
  Content,
  Label,
  PageSection,
  Title,
} from '@patternfly/react-core'
import { DEMO_ORGANIZATIONS } from '@osac/api-contracts'

export function ProviderTenantOrgsPage() {
  return (
    <PageSection>
      <div className="osac-page-toolbar-sticky">
        <div className="osac-page-toolbar-sticky__lead">
          <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
            Tenant organizations
          </Title>
          <Content component="p" style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}>
            All tenant organizations registered on this platform.
          </Content>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--pf-t--global--font--size--body--default)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--pf-t--global--border--color--default)' }}>
              {['Organization', 'ID', 'Description', 'VMs', 'Status'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: 'var(--pf-t--global--spacer--sm)',
                    textAlign: 'left',
                    fontWeight: 'var(--pf-t--global--font--weight--heading--bold)',
                    color: 'var(--pf-t--global--text--color--subtle)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEMO_ORGANIZATIONS.map((org) => (
              <tr
                key={org.id}
                style={{ borderBottom: '1px solid var(--pf-t--global--border--color--default)' }}
              >
                <td style={{ padding: 'var(--pf-t--global--spacer--sm)', fontWeight: 600 }}>
                  {org.displayName}
                </td>
                <td style={{ padding: 'var(--pf-t--global--spacer--sm)', color: 'var(--pf-t--global--text--color--subtle)' }}>
                  {org.metadata.name}
                </td>
                <td style={{ padding: 'var(--pf-t--global--spacer--sm)', color: 'var(--pf-t--global--text--color--subtle)', maxWidth: '320px' }}>
                  {org.description}
                </td>
                <td style={{ padding: 'var(--pf-t--global--spacer--sm)' }}>{org.vmCount ?? '—'}</td>
                <td style={{ padding: 'var(--pf-t--global--spacer--sm)' }}>
                  <Label color={org.status === 'active' ? 'green' : 'grey'} isCompact>
                    {org.status ?? 'unknown'}
                  </Label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  )
}
